using System.Text.Json;
using HomePulse.Models;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Services;

public record EcobeePinPairingResult(string Pin, int ExpiresInMinutes);

public record EcobeeThermostatSummary(
    string Name,
    double ActualTemperatureF,
    int HumidityPercent,
    double DesiredHeatF,
    double DesiredCoolF,
    string HvacMode
);

public interface IEcobeeIntegrationService
{
    Task<bool> IsConnectedAsync(CancellationToken ct = default);
    Task<EcobeePinPairingResult> StartAuthorizationAsync(CancellationToken ct = default);
    Task<(bool Success, string Message)> CompleteAuthorizationAsync(CancellationToken ct = default);
    Task<List<EcobeeThermostatSummary>> GetThermostatsAsync(CancellationToken ct = default);
    Task DisconnectAsync(CancellationToken ct = default);
}

public class EcobeeIntegrationService : IEcobeeIntegrationService
{
    private const string BaseUrl = "https://api.ecobee.com";
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EcobeeIntegrationService> _logger;

    public EcobeeIntegrationService(
        IHttpClientFactory httpClientFactory,
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<EcobeeIntegrationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
    }

    private string ApiKey => _configuration["Ecobee:ApiKey"] ?? "";

    public async Task<bool> IsConnectedAsync(CancellationToken ct = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var cred = await db.EcobeeCredentials.AsNoTracking().FirstOrDefaultAsync(c => c.Id == 1, ct);
        return cred?.IsConnected ?? false;
    }

    public async Task<EcobeePinPairingResult> StartAuthorizationAsync(CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(ApiKey))
            throw new InvalidOperationException("Ecobee:ApiKey is not configured in appsettings.json.");

        var client = _httpClientFactory.CreateClient();
        var url = $"{BaseUrl}/authorize?response_type=ecobeePin&client_id={Uri.EscapeDataString(ApiKey)}&scope=smartRead";
        var response = await client.GetAsync(url, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Ecobee authorize request failed: {Status} {Body}", response.StatusCode, body);
            throw new InvalidOperationException("Ecobee authorization request failed. Check that the API key is correct.");
        }

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        var pin = root.GetProperty("ecobeePin").GetString() ?? "";
        var code = root.GetProperty("code").GetString() ?? "";
        var expiresInMinutes = root.GetProperty("expires_in").GetInt32();

        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var cred = await db.EcobeeCredentials.FirstOrDefaultAsync(c => c.Id == 1, ct) ?? new EcobeeCredential { Id = 1 };
        cred.PendingAuthorizationCode = code;
        cred.PendingPin = pin;
        cred.PendingExpiresUtc = DateTime.UtcNow.AddMinutes(expiresInMinutes);
        if (db.Entry(cred).State == EntityState.Detached) db.EcobeeCredentials.Add(cred);
        await db.SaveChangesAsync(ct);

        return new EcobeePinPairingResult(pin, expiresInMinutes);
    }

    public async Task<(bool Success, string Message)> CompleteAuthorizationAsync(CancellationToken ct = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var cred = await db.EcobeeCredentials.FirstOrDefaultAsync(c => c.Id == 1, ct);

        if (cred?.PendingAuthorizationCode == null)
            return (false, "No pending Ecobee authorization. Click \"Connect Ecobee\" first.");

        if (cred.PendingExpiresUtc.HasValue && cred.PendingExpiresUtc.Value < DateTime.UtcNow)
            return (false, "The pairing PIN expired. Click \"Connect Ecobee\" again to get a new one.");

        var client = _httpClientFactory.CreateClient();
        var url = $"{BaseUrl}/token?grant_type=ecobeePin&code={Uri.EscapeDataString(cred.PendingAuthorizationCode)}&client_id={Uri.EscapeDataString(ApiKey)}";
        var response = await client.PostAsync(url, null, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        if (root.TryGetProperty("error", out var errorProp))
        {
            var error = errorProp.GetString();
            if (error == "authorization_pending")
                return (false, "Not yet. Enter the PIN at ecobee.com/consumerportal under My Apps, then try again.");

            _logger.LogWarning("Ecobee token exchange failed: {Body}", body);
            return (false, $"Ecobee rejected the pairing ({error}). Click \"Connect Ecobee\" to start over.");
        }

        cred.AccessToken = root.GetProperty("access_token").GetString();
        cred.RefreshToken = root.GetProperty("refresh_token").GetString();
        cred.AccessTokenExpiresUtc = DateTime.UtcNow.AddSeconds(root.GetProperty("expires_in").GetInt32() - 30);
        cred.PendingAuthorizationCode = null;
        cred.PendingPin = null;
        cred.PendingExpiresUtc = null;
        await db.SaveChangesAsync(ct);

        return (true, "Ecobee connected successfully.");
    }

    public async Task DisconnectAsync(CancellationToken ct = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var cred = await db.EcobeeCredentials.FirstOrDefaultAsync(c => c.Id == 1, ct);
        if (cred != null)
        {
            db.EcobeeCredentials.Remove(cred);
            await db.SaveChangesAsync(ct);
        }
    }

    private async Task<string?> GetFreshAccessTokenAsync(HomePulseDbContext db, CancellationToken ct)
    {
        var cred = await db.EcobeeCredentials.FirstOrDefaultAsync(c => c.Id == 1, ct);
        if (cred?.RefreshToken == null) return null;

        if (!string.IsNullOrEmpty(cred.AccessToken) && cred.AccessTokenExpiresUtc > DateTime.UtcNow)
            return cred.AccessToken;

        var client = _httpClientFactory.CreateClient();
        var url = $"{BaseUrl}/token?grant_type=refresh_token&refresh_token={Uri.EscapeDataString(cred.RefreshToken)}&client_id={Uri.EscapeDataString(ApiKey)}";
        var response = await client.PostAsync(url, null, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Ecobee token refresh failed: {Body}", body);
            return null;
        }

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        cred.AccessToken = root.GetProperty("access_token").GetString();
        cred.RefreshToken = root.GetProperty("refresh_token").GetString(); // ecobee rotates refresh tokens each use
        cred.AccessTokenExpiresUtc = DateTime.UtcNow.AddSeconds(root.GetProperty("expires_in").GetInt32() - 30);
        await db.SaveChangesAsync(ct);

        return cred.AccessToken;
    }

    public async Task<List<EcobeeThermostatSummary>> GetThermostatsAsync(CancellationToken ct = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var token = await GetFreshAccessTokenAsync(db, ct);
        if (token == null) return new List<EcobeeThermostatSummary>();

        var selection = "{\"selection\":{\"selectionType\":\"registered\",\"selectionMatch\":\"\",\"includeRuntime\":true,\"includeSettings\":true}}";
        var url = $"{BaseUrl}/1/thermostat?format=json&body={Uri.EscapeDataString(selection)}";

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
        var response = await client.GetAsync(url, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Ecobee thermostat fetch failed: {Status} {Body}", response.StatusCode, body);
            return new List<EcobeeThermostatSummary>();
        }

        var result = new List<EcobeeThermostatSummary>();
        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("thermostatList", out var list))
        {
            foreach (var t in list.EnumerateArray())
            {
                var runtime = t.GetProperty("runtime");
                var settings = t.GetProperty("settings");
                result.Add(new EcobeeThermostatSummary(
                    t.GetProperty("name").GetString() ?? "Thermostat",
                    runtime.GetProperty("actualTemperature").GetInt32() / 10.0,
                    runtime.GetProperty("actualHumidity").GetInt32(),
                    runtime.GetProperty("desiredHeat").GetInt32() / 10.0,
                    runtime.GetProperty("desiredCool").GetInt32() / 10.0,
                    settings.TryGetProperty("hvacMode", out var mode) ? mode.GetString() ?? "unknown" : "unknown"
                ));
            }
        }
        return result;
    }
}
