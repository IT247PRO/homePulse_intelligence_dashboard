using System.Net.Http.Json;
using System.Text.Json;
using HomePulse.Models;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Services;

public enum BlinkLoginOutcome { Connected, NeedsPinVerification, Failed }
public record BlinkLoginResult(BlinkLoginOutcome Outcome, string Message);

// Unofficial, reverse-engineered Blink API (Amazon publishes no official public API).
// Endpoint shapes are based on community reverse-engineering (the same shape blinkpy uses)
// and can change without notice on Blink's side. If login/status stops working, capture the
// raw response body (with token/password redacted) so the field mappings below can be fixed.
public interface IBlinkIntegrationService
{
    Task<bool> IsConnectedAsync(CancellationToken ct = default);
    Task<BlinkLoginResult> LoginAsync(string email, string password, CancellationToken ct = default);
    Task<BlinkLoginResult> VerifyPinAsync(string pin, CancellationToken ct = default);
    Task RefreshCameraStatusAsync(CancellationToken ct = default);
    Task DisconnectAsync(CancellationToken ct = default);
}

public class BlinkIntegrationService : IBlinkIntegrationService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BlinkIntegrationService> _logger;

    public BlinkIntegrationService(
        IHttpClientFactory httpClientFactory,
        IServiceProvider serviceProvider,
        ILogger<BlinkIntegrationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task<bool> IsConnectedAsync(CancellationToken ct = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var cred = await db.BlinkCredentials.AsNoTracking().FirstOrDefaultAsync(c => c.Id == 1, ct);
        return cred?.IsConnected ?? false;
    }

    public async Task<BlinkLoginResult> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var uniqueId = Guid.NewGuid().ToString();

            var payload = new
            {
                unique_id = uniqueId,
                email,
                password,
                client_name = "HomePulse Dashboard",
                reauth = true
            };

            var response = await client.PostAsJsonAsync("https://rest-prod.immedia-semi.com/api/v5/account/login", payload, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Blink login failed with status {Status}", response.StatusCode);
                return new BlinkLoginResult(BlinkLoginOutcome.Failed, "Blink rejected the email/password.");
            }

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            var token = root.GetProperty("auth").GetProperty("token").GetString();
            var accountId = root.GetProperty("account").GetProperty("id").ToString();
            var tier = root.GetProperty("account").TryGetProperty("tier", out var tierProp) ? tierProp.GetString() : "prod";
            var clientId = root.TryGetProperty("client", out var clientProp) && clientProp.TryGetProperty("id", out var cidProp)
                ? cidProp.ToString() : uniqueId;

            bool needsVerification = root.TryGetProperty("account", out var acct) &&
                                      acct.TryGetProperty("verification_required", out var vr) &&
                                      vr.GetBoolean();

            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
            var cred = await db.BlinkCredentials.FirstOrDefaultAsync(c => c.Id == 1, ct) ?? new BlinkCredential { Id = 1 };
            cred.AuthToken = needsVerification ? null : token; // don't treat as usable until verified
            cred.AccountId = accountId;
            cred.ClientId = clientId;
            cred.RegionTier = tier;
            cred.PendingVerificationLink = needsVerification ? token : null; // stash unverified token to complete the PIN step
            if (db.Entry(cred).State == EntityState.Detached) db.BlinkCredentials.Add(cred);
            await db.SaveChangesAsync(ct);

            if (needsVerification)
                return new BlinkLoginResult(BlinkLoginOutcome.NeedsPinVerification, "Check your email/phone for a Blink verification code.");

            return new BlinkLoginResult(BlinkLoginOutcome.Connected, "Blink connected successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Blink login threw an unexpected exception (API shape may have changed).");
            return new BlinkLoginResult(BlinkLoginOutcome.Failed, "Unexpected error talking to Blink. The unofficial API may have changed.");
        }
    }

    public async Task<BlinkLoginResult> VerifyPinAsync(string pin, CancellationToken ct = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var cred = await db.BlinkCredentials.FirstOrDefaultAsync(c => c.Id == 1, ct);

        if (cred?.PendingVerificationLink == null || cred.AccountId == null)
            return new BlinkLoginResult(BlinkLoginOutcome.Failed, "No pending Blink login. Enter your email/password again first.");

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("TOKEN_AUTH", cred.PendingVerificationLink);
            var url = $"https://rest-{cred.RegionTier}.immedia-semi.com/api/v4/account/{cred.AccountId}/client/{cred.ClientId}/pin/verify";

            var response = await client.PostAsJsonAsync(url, new { pin }, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            using var doc = JsonDocument.Parse(body);
            var verified = doc.RootElement.TryGetProperty("valid", out var validProp) && validProp.GetBoolean();

            if (!response.IsSuccessStatusCode || !verified)
            {
                _logger.LogWarning("Blink PIN verification failed: {Body}", body);
                return new BlinkLoginResult(BlinkLoginOutcome.Failed, "Incorrect or expired PIN. Log in again to get a new code.");
            }

            cred.AuthToken = cred.PendingVerificationLink;
            cred.PendingVerificationLink = null;
            await db.SaveChangesAsync(ct);

            return new BlinkLoginResult(BlinkLoginOutcome.Connected, "Blink connected successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Blink PIN verification threw an unexpected exception (API shape may have changed).");
            return new BlinkLoginResult(BlinkLoginOutcome.Failed, "Unexpected error verifying the PIN. The unofficial API may have changed.");
        }
    }

    public async Task DisconnectAsync(CancellationToken ct = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var cred = await db.BlinkCredentials.FirstOrDefaultAsync(c => c.Id == 1, ct);
        if (cred != null)
        {
            db.BlinkCredentials.Remove(cred);
            await db.SaveChangesAsync(ct);
        }
        var cameras = await db.BlinkCameras.ToListAsync(ct);
        db.BlinkCameras.RemoveRange(cameras);
        await db.SaveChangesAsync(ct);
    }

    public async Task RefreshCameraStatusAsync(CancellationToken ct = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var cred = await db.BlinkCredentials.FirstOrDefaultAsync(c => c.Id == 1, ct);
        if (cred?.AuthToken == null) return;

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("TOKEN_AUTH", cred.AuthToken);
            var url = $"https://rest-{cred.RegionTier}.immedia-semi.com/api/v3/accounts/{cred.AccountId}/homescreen";

            var response = await client.GetAsync(url, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Blink homescreen fetch failed with status {Status}", response.StatusCode);
                return;
            }

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            var existing = await db.BlinkCameras.ToDictionaryAsync(c => c.Name, ct);

            void Upsert(string name, string deviceType, bool online, bool armed, int? battery, double? tempC, DateTime? motion)
            {
                if (!existing.TryGetValue(name, out var cam))
                {
                    cam = new BlinkCamera { Name = name, DeviceType = deviceType };
                    db.BlinkCameras.Add(cam);
                    existing[name] = cam;
                }
                cam.DeviceType = deviceType;
                cam.IsOnline = online;
                cam.IsArmed = armed;
                cam.BatteryPercent = battery;
                cam.TemperatureCelsius = tempC;
                cam.LastMotionUtc = motion ?? cam.LastMotionUtc;
                cam.LastUpdatedUtc = DateTime.UtcNow;
            }

            if (root.TryGetProperty("cameras", out var cameras))
            {
                foreach (var cam in cameras.EnumerateArray())
                {
                    var name = GetString(cam, "name") ?? "Camera";
                    var status = GetString(cam, "status") ?? "unknown";
                    var online = status is "online" or "done" or "ready";
                    var armed = GetBool(cam, "enabled") ?? true;
                    int? battery = TryParseBatteryPercent(cam);
                    double? tempC = TryParseTemperatureCelsius(cam);
                    Upsert(name, "camera", online, armed, battery, tempC, null);
                }
            }

            if (root.TryGetProperty("sync_modules", out var syncModules))
            {
                foreach (var sm in syncModules.EnumerateArray())
                {
                    var name = GetString(sm, "name") ?? "Sync Module";
                    var status = GetString(sm, "status") ?? "unknown";
                    Upsert(name, "sync_module", status is "online" or "done", true, null, null, null);
                }
            }

            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Blink camera status refresh threw an unexpected exception (API shape may have changed).");
        }
    }

    private static string? GetString(JsonElement el, string prop) =>
        el.TryGetProperty(prop, out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() : null;

    private static bool? GetBool(JsonElement el, string prop) =>
        el.TryGetProperty(prop, out var p) && (p.ValueKind == JsonValueKind.True || p.ValueKind == JsonValueKind.False) ? p.GetBoolean() : null;

    private static int? TryParseBatteryPercent(JsonElement cam)
    {
        if (!cam.TryGetProperty("battery", out var b)) return null;
        if (b.ValueKind == JsonValueKind.Number) return b.GetInt32();
        if (b.ValueKind == JsonValueKind.String)
        {
            var s = b.GetString();
            return s?.ToLowerInvariant() switch { "ok" or "full" => 100, "low" => 15, _ => null };
        }
        return null;
    }

    private static double? TryParseTemperatureCelsius(JsonElement cam)
    {
        if (!cam.TryGetProperty("temp", out var t)) return null;
        double? fahrenheit = t.ValueKind switch
        {
            JsonValueKind.Number => t.GetDouble(),
            JsonValueKind.String when double.TryParse(t.GetString(), out var parsed) => parsed,
            _ => null
        };
        return fahrenheit.HasValue ? Math.Round((fahrenheit.Value - 32) / 1.8, 1) : null;
    }
}
