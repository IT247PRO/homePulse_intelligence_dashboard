using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Models;

public enum DeviceCategory
{
    Infrastructure,
    Storage,
    Mobile,
    IoT,
    Workstation
}

public enum AlertSeverity
{
    Info,
    Warning,
    Critical
}

public enum WidgetType
{
    NetworkSummary,
    DeviceGrid,
    NasStorage,
    ServiceHealth,
    GoogleCalendar,
    GmailHighlights,
    SpeedtestGraph,
    AlertsFeed
}

[Table("NetworkDevices")]
public class NetworkDevice
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(18)]
    public string MacAddress { get; set; } = string.Empty;

    [Required]
    [MaxLength(45)]
    public string IpAddress { get; set; } = string.Empty;

    [MaxLength(128)]
    public string Hostname { get; set; } = string.Empty;

    [MaxLength(128)]
    public string CustomAlias { get; set; } = string.Empty;

    public DeviceCategory Category { get; set; } = DeviceCategory.IoT;

    [MaxLength(128)]
    public string Vendor { get; set; } = "Unknown Vendor";

    public bool IsOnline { get; set; } = true;

    public double PingLatencyMs { get; set; } = 0.0;

    public string OpenPortsJson { get; set; } = "[]";

    public bool IsWhitelisted { get; set; } = false;

    public bool IsAlertMuted { get; set; } = false;

    public string? Notes { get; set; }

    public DateTime FirstDiscoveredUtc { get; set; } = DateTime.UtcNow;

    public DateTime LastSeenUtc { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public List<int> OpenPorts
    {
        get => JsonSerializer.Deserialize<List<int>>(string.IsNullOrWhiteSpace(OpenPortsJson) ? "[]" : OpenPortsJson) ?? new();
        set => OpenPortsJson = JsonSerializer.Serialize(value);
    }
}

[Table("MonitoredServices")]
public class MonitoredService
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(512)]
    public string TargetUrl { get; set; } = string.Empty;

    public int ExpectedStatusCode { get; set; } = 200;

    public int CheckIntervalSeconds { get; set; } = 60;

    public bool IsOnline { get; set; } = true;

    public int LastStatusCode { get; set; } = 200;

    public double ResponseLatencyMs { get; set; } = 0.0;

    public DateTime? SslCertExpiryUtc { get; set; }

    public int? SslDaysRemaining { get; set; }

    public bool IsEnabled { get; set; } = true;

    public DateTime LastCheckedUtc { get; set; } = DateTime.UtcNow;
}

[Table("DashboardWidgets")]
public class DashboardWidget
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    public WidgetType Type { get; set; } = WidgetType.NetworkSummary;

    public int GridColSpan { get; set; } = 1;

    public int GridRowSpan { get; set; } = 1;

    public int OrderIndex { get; set; } = 0;

    public string ConfigurationJson { get; set; } = "{}";

    public bool IsActive { get; set; } = true;
}

[Table("SystemAlerts")]
public class SystemAlert
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

    public AlertSeverity Severity { get; set; } = AlertSeverity.Info;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Source { get; set; } = "NetworkEngine";

    public bool IsResolved { get; set; } = false;

    public string DispatchedWebhooksJson { get; set; } = "[]";
}

[Table("SpeedTestRecords")]
public class SpeedTestRecord
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

    public double DownloadMbps { get; set; }

    public double UploadMbps { get; set; }

    public double PingLatencyMs { get; set; }

    public double JitterMs { get; set; }

    [MaxLength(128)]
    public string ServerLocation { get; set; } = "Local ISP Gateway";

    [MaxLength(64)]
    public string ClientIp { get; set; } = string.Empty;
}

[Table("NasStorageNodes")]
public class NasStorageNode
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(45)]
    public string HostIp { get; set; } = string.Empty;

    [MaxLength(64)]
    public string NasType { get; set; } = "Synology DSM";

    public double CpuUsagePercent { get; set; }

    public double RamUsagePercent { get; set; }

    public long DiskUsedBytes { get; set; }

    public long DiskTotalBytes { get; set; }

    [MaxLength(64)]
    public string RaidStatus { get; set; } = "Healthy (RAID 5)";

    public string DriveTemperaturesJson { get; set; } = "[{\"drive\":\"Drive 1 (Seagate IronWolf 8TB)\",\"tempC\":36,\"status\":\"Normal\"},{\"drive\":\"Drive 2 (Seagate IronWolf 8TB)\",\"tempC\":37,\"status\":\"Normal\"},{\"drive\":\"Drive 3 (Seagate IronWolf 8TB)\",\"tempC\":35,\"status\":\"Normal\"},{\"drive\":\"Drive 4 (Seagate IronWolf 8TB)\",\"tempC\":38,\"status\":\"Normal\"}]";

    public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;
}

[Table("EcobeeCredentials")]
public class EcobeeCredential
{
    [Key]
    public int Id { get; set; } = 1;

    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime AccessTokenExpiresUtc { get; set; }

    // Set while the PIN pairing flow is in progress (ecobee.com/consumerportal), cleared once tokens are issued.
    public string? PendingAuthorizationCode { get; set; }
    public string? PendingPin { get; set; }
    public DateTime? PendingExpiresUtc { get; set; }

    public bool IsConnected => !string.IsNullOrEmpty(RefreshToken);
}

[Table("BlinkCredentials")]
public class BlinkCredential
{
    [Key]
    public int Id { get; set; } = 1;

    public string? AuthToken { get; set; }
    public string? AccountId { get; set; }
    public string? ClientId { get; set; }
    public string? RegionTier { get; set; }

    // Set while an email/password login is awaiting 2FA PIN verification.
    public string? PendingVerificationLink { get; set; }

    public bool IsConnected => !string.IsNullOrEmpty(AuthToken);
}

[Table("BlinkCameras")]
public class BlinkCamera
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(64)]
    public string DeviceType { get; set; } = "camera"; // camera | sync_module | owl | doorbell

    public bool IsOnline { get; set; }
    public bool IsArmed { get; set; }
    public int? BatteryPercent { get; set; }
    public double? TemperatureCelsius { get; set; }
    public DateTime? LastMotionUtc { get; set; }
    public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;
}

public class HomePulseDbContext : DbContext
{
    public HomePulseDbContext(DbContextOptions<HomePulseDbContext> options) : base(options) { }

    public DbSet<NetworkDevice> Devices => Set<NetworkDevice>();
    public DbSet<MonitoredService> Services => Set<MonitoredService>();
    public DbSet<DashboardWidget> Widgets => Set<DashboardWidget>();
    public DbSet<SystemAlert> Alerts => Set<SystemAlert>();
    public DbSet<SpeedTestRecord> SpeedTestRecords => Set<SpeedTestRecord>();
    public DbSet<NasStorageNode> NasNodes => Set<NasStorageNode>();
    public DbSet<EcobeeCredential> EcobeeCredentials => Set<EcobeeCredential>();
    public DbSet<BlinkCredential> BlinkCredentials => Set<BlinkCredential>();
    public DbSet<BlinkCamera> BlinkCameras => Set<BlinkCamera>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<NetworkDevice>()
            .HasIndex(d => d.MacAddress)
            .IsUnique();

        modelBuilder.Entity<NetworkDevice>()
            .HasIndex(d => d.IpAddress);

        modelBuilder.Entity<MonitoredService>()
            .HasIndex(s => s.TargetUrl);

        modelBuilder.Entity<SystemAlert>()
            .HasIndex(a => a.TimestampUtc);

        // Seed initial reference devices
        var seedDate = new DateTime(2026, 9, 17, 12, 0, 0, DateTimeKind.Utc);
        modelBuilder.Entity<NetworkDevice>().HasData(
            new NetworkDevice
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                MacAddress = "24:5A:4C:11:22:33",
                IpAddress = "192.168.1.1",
                Hostname = "udm-pro.lan",
                CustomAlias = "Ubiquiti Dream Machine Pro",
                Category = DeviceCategory.Infrastructure,
                Vendor = "Ubiquiti Networks Inc.",
                IsOnline = true,
                PingLatencyMs = 0.8,
                OpenPortsJson = "[22, 53, 80, 443, 8443]",
                IsWhitelisted = true,
                FirstDiscoveredUtc = seedDate,
                LastSeenUtc = seedDate
            },
            new NetworkDevice
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                MacAddress = "00:11:32:AA:BB:CC",
                IpAddress = "192.168.1.10",
                Hostname = "synology-ds920.lan",
                CustomAlias = "Main Vault NAS (Synology DS920+)",
                Category = DeviceCategory.Storage,
                Vendor = "Synology Incorporated",
                IsOnline = true,
                PingLatencyMs = 1.4,
                OpenPortsJson = "[22, 80, 443, 445, 5000, 5001]",
                IsWhitelisted = true,
                FirstDiscoveredUtc = seedDate,
                LastSeenUtc = seedDate
            },
            new NetworkDevice
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                MacAddress = "B8:27:EB:D1:E2:F3",
                IpAddress = "192.168.1.15",
                Hostname = "homeassistant.lan",
                CustomAlias = "Home Assistant Supervised (RPi 5)",
                Category = DeviceCategory.IoT,
                Vendor = "Raspberry Pi Foundation",
                IsOnline = true,
                PingLatencyMs = 2.1,
                OpenPortsJson = "[22, 8123, 1883]",
                IsWhitelisted = true,
                FirstDiscoveredUtc = seedDate,
                LastSeenUtc = seedDate
            }
        );
    }
}
