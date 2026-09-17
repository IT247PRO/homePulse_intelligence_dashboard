using System.Security.Claims;
using HomePulse.Hubs;
using HomePulse.Models;
using HomePulse.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure EF Core Database (SQLite / PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Data Source=homepulse.db";
builder.Services.AddDbContext<HomePulseDbContext>(options =>
{
    options.UseSqlite(connectionString);
});

// 2. HTTP Client & Services Registration
builder.Services.AddHttpClient();
builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<IOUIVendorLookup, OUIVendorLookup>();
builder.Services.AddScoped<IAlertDispatcherService, AlertDispatcherService>();
builder.Services.AddScoped<IGoogleIntegrationService, GoogleIntegrationService>();
builder.Services.AddSingleton<ISpeedTestService, SpeedTestService>();
builder.Services.AddScoped<IEcobeeIntegrationService, EcobeeIntegrationService>();
builder.Services.AddScoped<IBlinkIntegrationService, BlinkIntegrationService>();

// 3. Hosted Background Services
builder.Services.AddHostedService<NetworkScannerService>();
builder.Services.AddHostedService<ServiceMonitorWorker>();
builder.Services.AddHostedService<SpeedTestService>();
builder.Services.AddHostedService<BlinkMonitorWorker>();

// 4. SignalR Real-Time Engine
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
}).AddJsonProtocol(options =>
{
    options.PayloadSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

// 5. Strict Google OAuth 2.0 & Cookie Authentication Setup
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.Name = "HomePulse.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.ExpireTimeSpan = TimeSpan.FromDays(14);
    options.SlidingExpiration = true;
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api"))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }
        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
})
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"] ?? "dummy_client_id";
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"] ?? "dummy_client_secret";
    options.CallbackPath = "/signin-google";
    options.SaveTokens = true;

    // Request required Google Workspace scopes
    options.Scope.Add("https://www.googleapis.com/auth/calendar.readonly");
    options.Scope.Add("https://www.googleapis.com/auth/gmail.readonly");
    options.Scope.Add("email");
    options.Scope.Add("profile");

    // Capture access token & refresh token for background queries
    options.ClaimActions.MapJsonKey(ClaimTypes.Email, "email");
    options.ClaimActions.MapJsonKey(ClaimTypes.Name, "name");
    options.ClaimActions.MapJsonKey("urn:google:picture", "picture");
});

// 6. Custom Authorization Policy: Strict Whitelist Handler
builder.Services.AddSingleton<IAuthorizationHandler, EmailWhitelistHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("WhitelistedGoogleEmailOnly", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.Requirements.Add(new EmailWhitelistRequirement());
    });
    
    // Default fallback policy
    options.DefaultPolicy = options.GetPolicy("WhitelistedGoogleEmailOnly")!;
});

// 7. CORS Configuration for Front-End (Blazor / React / Razor Pages)
builder.Services.AddCors(options =>
{
    options.AddPolicy("DashboardCorsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 8. Swagger OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Ensure Database Initialized
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseRouting();
app.UseCors("DashboardCorsPolicy");
app.UseAuthentication();
app.UseAuthorization();

// ==========================================
// ASP.NET Core MVC Default Route
// ==========================================
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// ==========================================
// SignalR Hub Endpoint
// ==========================================
app.MapHub<DashboardHub>("/hubs/network");

// ==========================================
// Authentication Endpoints
// ==========================================
app.MapGet("/api/auth/login", (string? returnUrl) =>
{
    var redirectUrl = returnUrl ?? "/";
    return Results.Challenge(new AuthenticationProperties { RedirectUri = redirectUrl }, [GoogleDefaults.AuthenticationScheme]);
}).AllowAnonymous();

app.MapGet("/api/auth/logout", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Redirect("/");
});

app.MapGet("/api/auth/me", (HttpContext context) =>
{
    var user = context.User;
    if (user.Identity?.IsAuthenticated != true)
    {
        return Results.Json(new { isAuthenticated = false });
    }

    var email = user.FindFirst(ClaimTypes.Email)?.Value ?? "";
    var name = user.FindFirst(ClaimTypes.Name)?.Value ?? "Authorized User";
    var picture = user.FindFirst("urn:google:picture")?.Value ?? "";

    return Results.Json(new
    {
        isAuthenticated = true,
        email,
        name,
        picture,
        isWhitelisted = true
    });
});

// ==========================================
// Network Devices Endpoints
// ==========================================
var devicesGroup = app.MapGroup("/api/devices").RequireAuthorization("WhitelistedGoogleEmailOnly");

devicesGroup.MapGet("/", async (HomePulseDbContext db, DeviceCategory? category, string? search) =>
{
    var query = db.Devices.AsNoTracking().AsQueryable();

    if (category.HasValue)
        query = query.Where(d => d.Category == category.Value);

    if (!string.IsNullOrWhiteSpace(search))
    {
        var s = search.Trim().ToLower();
        query = query.Where(d => d.IpAddress.Contains(s) || 
                                 d.MacAddress.Contains(s) || 
                                 d.CustomAlias.ToLower().Contains(s) || 
                                 d.Vendor.ToLower().Contains(s));
    }

    var list = await query.OrderByDescending(d => d.IsOnline)
                          .ThenBy(d => d.IpAddress)
                          .ToListAsync();
    return Results.Ok(list);
});

devicesGroup.MapPut("/{id:guid}", async (Guid id, NetworkDevice updated, HomePulseDbContext db, IHubContext<DashboardHub, IDashboardClient> hub) =>
{
    var device = await db.Devices.FindAsync(id);
    if (device == null) return Results.NotFound();

    device.CustomAlias = updated.CustomAlias;
    device.Category = updated.Category;
    device.IsWhitelisted = updated.IsWhitelisted;
    device.IsAlertMuted = updated.IsAlertMuted;
    device.Notes = updated.Notes;

    await db.SaveChangesAsync();
    await hub.Clients.Group("DashboardSubscribers").ReceiveDeviceUpdated(device);

    return Results.Ok(device);
});

devicesGroup.MapPost("/{id:guid}/scan-ports", async (Guid id, HomePulseDbContext db, NetworkScannerService scanner, IHubContext<DashboardHub, IDashboardClient> hub) =>
{
    var device = await db.Devices.FindAsync(id);
    if (device == null) return Results.NotFound();

    var targetPorts = new[] { 21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 1883, 3000, 3389, 5000, 5001, 8080, 8123, 8443, 9000, 9443 };
    var openPorts = await scanner.ProbePortsAsync(device.IpAddress, targetPorts, 400);

    device.OpenPorts = openPorts;
    await db.SaveChangesAsync();
    await hub.Clients.Group("DashboardSubscribers").ReceiveDeviceUpdated(device);

    return Results.Ok(new { ip = device.IpAddress, openPorts });
});

app.MapPost("/api/network/scan-now", async (NetworkScannerService scanner) =>
{
    _ = Task.Run(() => scanner.ExecuteSubnetScanCycleAsync());
    return Results.Accepted(value: new { message = "Subnet sweep initiated across configured ranges." });
}).RequireAuthorization("WhitelistedGoogleEmailOnly");

// ==========================================
// Monitored Services & SSL
// ==========================================
var servicesGroup = app.MapGroup("/api/services").RequireAuthorization("WhitelistedGoogleEmailOnly");

servicesGroup.MapGet("/", async (HomePulseDbContext db) =>
{
    var list = await db.Services.AsNoTracking().ToListAsync();
    return Results.Ok(list);
});

servicesGroup.MapPost("/", async (MonitoredService service, HomePulseDbContext db) =>
{
    db.Services.Add(service);
    await db.SaveChangesAsync();
    return Results.Created($"/api/services/{service.Id}", service);
});

servicesGroup.MapDelete("/{id:guid}", async (Guid id, HomePulseDbContext db) =>
{
    var s = await db.Services.FindAsync(id);
    if (s == null) return Results.NotFound();
    db.Services.Remove(s);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// ==========================================
// NAS & Storage Infrastructure
// ==========================================
app.MapGet("/api/nas/nodes", async (HomePulseDbContext db) =>
{
    var nodes = await db.NasNodes.AsNoTracking().ToListAsync();
    if (nodes.Count == 0)
    {
        // Provide seeded default node if empty
        var defaultNode = new NasStorageNode
        {
            Name = "Synology DiskStation DS920+",
            HostIp = "192.168.1.10",
            NasType = "Synology DSM 7.2",
            CpuUsagePercent = 24.5,
            RamUsagePercent = 48.2,
            DiskUsedBytes = 14_800_000_000_000, // 14.8 TB
            DiskTotalBytes = 24_000_000_000_000, // 24 TB
            RaidStatus = "Healthy (Synology Hybrid RAID - 1 Drive Fault Tolerance)",
            LastUpdatedUtc = DateTime.UtcNow
        };
        db.NasNodes.Add(defaultNode);
        await db.SaveChangesAsync();
        nodes.Add(defaultNode);
    }
    return Results.Ok(nodes);
}).RequireAuthorization("WhitelistedGoogleEmailOnly");

// ==========================================
// SpeedTest & Alerts
// ==========================================
app.MapGet("/api/speedtest/history", async (HomePulseDbContext db) =>
{
    var records = await db.SpeedTestRecords.OrderByDescending(r => r.TimestampUtc).Take(30).ToListAsync();
    return Results.Ok(records);
}).RequireAuthorization("WhitelistedGoogleEmailOnly");

app.MapPost("/api/speedtest/run", async (ISpeedTestService speedService) =>
{
    var res = await speedService.RunBenchmarkAsync();
    return Results.Ok(res);
}).RequireAuthorization("WhitelistedGoogleEmailOnly");

app.MapGet("/api/alerts", async (HomePulseDbContext db) =>
{
    var alerts = await db.Alerts.OrderByDescending(a => a.TimestampUtc).Take(50).ToListAsync();
    return Results.Ok(alerts);
}).RequireAuthorization("WhitelistedGoogleEmailOnly");

app.MapPost("/api/alerts/test", async (IAlertDispatcherService alertDispatcher) =>
{
    await alertDispatcher.TestWebhooksAsync();
    return Results.Ok(new { message = "Test alert sent to configured webhooks and SignalR." });
}).RequireAuthorization("WhitelistedGoogleEmailOnly");

// ==========================================
// Google Workspace Integrations
// ==========================================
app.MapGet("/api/google/calendar", async (HttpContext ctx, IGoogleIntegrationService googleService) =>
{
    var token = await ctx.GetTokenAsync("access_token") ?? "";
    var events = await googleService.GetTodayCalendarEventsAsync(token);
    return Results.Ok(events);
}).RequireAuthorization("WhitelistedGoogleEmailOnly");

app.MapGet("/api/google/gmail", async (HttpContext ctx, IGoogleIntegrationService googleService) =>
{
    var token = await ctx.GetTokenAsync("access_token") ?? "";
    var highlights = await googleService.GetMailHighlightsAsync(token);
    return Results.Ok(highlights);
}).RequireAuthorization("WhitelistedGoogleEmailOnly");

app.Run();

// ==========================================
// Security: Email Whitelist Policy & Requirement
// ==========================================
public class EmailWhitelistRequirement : IAuthorizationRequirement { }

public class EmailWhitelistHandler : AuthorizationHandler<EmailWhitelistRequirement>
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailWhitelistHandler> _logger;

    public EmailWhitelistHandler(IConfiguration configuration, ILogger<EmailWhitelistHandler> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, EmailWhitelistRequirement requirement)
    {
        var email = context.User.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrWhiteSpace(email))
        {
            _logger.LogWarning("Authorization rejected: User has no email claim.");
            context.Fail();
            return Task.CompletedTask;
        }

        var allowedEmails = _configuration.GetSection("Security:AllowedGoogleEmails").Get<string[]>() ?? [];

        if (allowedEmails.Contains(email, StringComparer.OrdinalIgnoreCase))
        {
            _logger.LogDebug("Authorization granted for whitelisted user: {Email}", email);
            context.Succeed(requirement);
        }
        else
        {
            _logger.LogWarning("Access DENIED: User {Email} is not present in Security:AllowedGoogleEmails whitelist.", email);
            context.Fail();
        }

        return Task.CompletedTask;
    }
}
