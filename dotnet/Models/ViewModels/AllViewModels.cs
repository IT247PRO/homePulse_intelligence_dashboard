using HomePulse.Models;

namespace HomePulse.Models.ViewModels;

public class DashboardViewModel
{
    public double HealthIndexPercent { get; set; } = 98.5;
    public int TotalDeviceCount { get; set; }
    public int OnlineDeviceCount { get; set; }
    public double AverageLatencyMs { get; set; }
    public SpeedTestRecord? LatestSpeedTest { get; set; }
    public List<NetworkDevice> CriticalDevices { get; set; } = new();
    public List<SystemAlert> ActiveAlerts { get; set; } = new();
    public List<MonitoredService> MonitoredServices { get; set; } = new();
    public List<NasStorageNode> NasNodes { get; set; } = new();
    public string UserEmail { get; set; } = string.Empty;
}

public class DeviceListViewModel
{
    public List<NetworkDevice> Devices { get; set; } = new();
    public string SelectedCategory { get; set; } = "All";
    public string SearchQuery { get; set; } = string.Empty;
}

public class StorageViewModel
{
    public List<NasStorageNode> Nodes { get; set; } = new();
    public double TotalAllocatedTb { get; set; }
    public double TotalUsedTb { get; set; }
}

public class ServiceHealthViewModel
{
    public List<MonitoredService> Services { get; set; } = new();
}

public class SpeedTestViewModel
{
    public SpeedTestRecord? Latest { get; set; }
    public List<SpeedTestRecord> History { get; set; } = new();
}

public class AlertsViewModel
{
    public List<SystemAlert> Alerts { get; set; } = new();
}

public class ChatViewModel
{
    public List<string> SuggestedPrompts { get; set; } = new();
}
