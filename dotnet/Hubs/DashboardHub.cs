using HomePulse.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HomePulse.Hubs;

public interface IDashboardClient
{
    Task ReceiveDeviceDiscovered(NetworkDevice device);
    Task ReceiveDeviceUpdated(NetworkDevice device);
    Task ReceiveDeviceStatusChanged(string ipAddress, string macAddress, bool isOnline, double latencyMs);
    Task ReceivePingLatency(string ipAddress, double latencyMs);
    Task ReceiveServiceHealth(MonitoredService service);
    Task ReceiveAlert(SystemAlert alert);
    Task ReceiveSpeedTestResult(SpeedTestRecord record);
    Task ReceiveNasStorageUpdate(NasStorageNode node);
    Task ReceiveScanProgress(int scannedCount, int totalTargets, string statusMessage);
}

[Authorize]
public class DashboardHub : Hub<IDashboardClient>
{
    private readonly ILogger<DashboardHub> _logger;

    public DashboardHub(ILogger<DashboardHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var user = Context.User?.Identity?.Name ?? "Anonymous";
        _logger.LogInformation("SignalR client connected: {ConnectionId}, User: {User}", Context.ConnectionId, user);
        await Groups.AddToGroupAsync(Context.ConnectionId, "DashboardSubscribers");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("SignalR client disconnected: {ConnectionId}", Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "DashboardSubscribers");
        await base.OnDisconnectedAsync(exception);
    }

    public async Task SubscribeToDevice(string ipAddress)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"device_{ipAddress}");
    }

    public async Task UnsubscribeFromDevice(string ipAddress)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"device_{ipAddress}");
    }
}
