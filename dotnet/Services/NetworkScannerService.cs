using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using HomePulse.Hubs;
using HomePulse.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Services;

public partial class NetworkScannerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IOUIVendorLookup _vendorLookup;
    private readonly IAlertDispatcherService _alertDispatcher;
    private readonly IHubContext<DashboardHub, IDashboardClient> _hubContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NetworkScannerService> _logger;

    // Windows native SendARP interop
    [LibraryImport("iphlpapi.dll", EntryPoint = "SendARP")]
    private static partial uint SendARP(uint destIp, uint srcIp, byte[] macAddr, ref uint physicalAddrLen);

    public NetworkScannerService(
        IServiceProvider serviceProvider,
        IOUIVendorLookup vendorLookup,
        IAlertDispatcherService alertDispatcher,
        IHubContext<DashboardHub, IDashboardClient> hubContext,
        IConfiguration configuration,
        ILogger<NetworkScannerService> logger)
    {
        _serviceProvider = serviceProvider;
        _vendorLookup = vendorLookup;
        _alertDispatcher = alertDispatcher;
        _hubContext = hubContext;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HomePulse NetworkScannerService worker started.");

        // Allow app startup to complete before initial sweep
        await Task.Delay(3000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var intervalSec = _configuration.GetValue("NetworkScanner:ArpScanIntervalSeconds", 30);
                await ExecuteSubnetScanCycleAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromSeconds(intervalSec), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception during network scan cycle.");
                await Task.Delay(10000, stoppingToken);
            }
        }

        _logger.LogInformation("HomePulse NetworkScannerService worker stopped.");
    }

    public async Task ExecuteSubnetScanCycleAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Initiating local network discovery cycle...");

        // 1. Gather configured subnets plus every real, active local subnet on this host
        var configuredSubnets = _configuration.GetSection("NetworkScanner:TargetSubnets").Get<string[]>()
                                 ?? Array.Empty<string>();
        var detectedSubnets = GetActiveLocalSubnets();
        var subnets = configuredSubnets.Concat(detectedSubnets)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (subnets.Count == 0)
        {
            subnets = ["192.168.1.0/24"];
        }

        _logger.LogInformation("Target subnets for this cycle: {Subnets}", string.Join(", ", subnets));

        var pingTimeoutMs = _configuration.GetValue("NetworkScanner:PingTimeoutMs", 800);
        var concurrency = _configuration.GetValue("NetworkScanner:ConcurrentPingLimit", 32);

        foreach (var subnetCidr in subnets)
        {
            if (ct.IsCancellationRequested) break;

            var ipList = GenerateIpsFromCidr(subnetCidr);
            _logger.LogInformation("Sweeping subnet {Subnet} ({Count} target addresses)...", subnetCidr, ipList.Count);

            // Notify SignalR clients of scan start
            await _hubContext.Clients.Group("DashboardSubscribers")
                .ReceiveScanProgress(0, ipList.Count, $"Sweeping subnet {subnetCidr}...");

            using var semaphore = new SemaphoreSlim(concurrency);
            var responsiveIps = new ConcurrentDictionary<string, double>();
            int scannedCounter = 0;

            var pingTasks = ipList.Select(async ip =>
            {
                await semaphore.WaitAsync(ct);
                try
                {
                    using var ping = new Ping();
                    var reply = await ping.SendPingAsync(ip, pingTimeoutMs);
                    if (reply.Status == IPStatus.Success)
                    {
                        responsiveIps[ip] = reply.RoundtripTime;
                    }
                }
                catch
                {
                    // Host unresponsive or icmp blocked
                }
                finally
                {
                    var current = Interlocked.Increment(ref scannedCounter);
                    if (current % 30 == 0 || current == ipList.Count)
                    {
                        _ = _hubContext.Clients.Group("DashboardSubscribers")
                            .ReceiveScanProgress(current, ipList.Count, $"Scanned {current}/{ipList.Count} hosts...");
                    }
                    semaphore.Release();
                }
            });

            await Task.WhenAll(pingTasks);

            // 2. Read ARP / Neighbor Cache (Linux/Docker /proc/net/arp or Windows SendARP)
            var arpTable = await RetrieveArpCacheAsync(responsiveIps.Keys.ToList(), ct);

            // 3. Multicast discovery (mDNS / SSDP) for service hints
            _ = Task.Run(() => SendMulticastProbesAsync(ct), ct);

            // 4. Synchronize with Database & SignalR
            await ProcessDiscoveredHostsAsync(responsiveIps, arpTable, ct);
        }

        _logger.LogInformation("Discovery cycle complete.");
    }

    private async Task ProcessDiscoveredHostsAsync(
        ConcurrentDictionary<string, double> responsiveIps,
        Dictionary<string, string> arpTable,
        CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var existingDevices = await db.Devices.ToDictionaryAsync(d => d.MacAddress, StringComparer.OrdinalIgnoreCase, ct);

        var defaultPorts = _configuration.GetSection("NetworkScanner:DefaultPortsToProbe").Get<int[]>()
                           ?? [22, 80, 443, 445, 8080, 9000];

        foreach (var (ip, latency) in responsiveIps)
        {
            if (ct.IsCancellationRequested) break;

            // Attempt to find MAC in ARP table
            string macAddress = arpTable.TryGetValue(ip, out var foundMac) ? foundMac : GenerateSyntheticMacForIp(ip);

            // Lookup OUI Vendor
            string vendor = _vendorLookup.LookupVendor(macAddress);

            // Reverse DNS resolution
            string hostname = await ResolveHostnameAsync(ip);

            // Fast TCP Port Probe
            var openPorts = await ProbePortsAsync(ip, defaultPorts, 350, ct);

            if (existingDevices.TryGetValue(macAddress, out var device))
            {
                // Existing device update
                bool statusChanged = !device.IsOnline;
                device.IsOnline = true;
                device.IpAddress = ip;
                device.PingLatencyMs = latency;
                device.LastSeenUtc = DateTime.UtcNow;
                device.OpenPorts = openPorts;
                if (!string.IsNullOrEmpty(hostname) && string.IsNullOrEmpty(device.Hostname))
                {
                    device.Hostname = hostname;
                }

                await db.SaveChangesAsync(ct);

                // Broadcast live ping & status
                await _hubContext.Clients.Group("DashboardSubscribers")
                    .ReceiveDeviceUpdated(device);
                await _hubContext.Clients.Group("DashboardSubscribers")
                    .ReceivePingLatency(ip, latency);

                if (statusChanged && !device.IsAlertMuted)
                {
                    await _hubContext.Clients.Group("DashboardSubscribers")
                        .ReceiveDeviceStatusChanged(device.IpAddress, device.MacAddress, true, latency);
                }
            }
            else
            {
                // New device discovered!
                var newDevice = new NetworkDevice
                {
                    MacAddress = macAddress,
                    IpAddress = ip,
                    Hostname = hostname,
                    CustomAlias = string.IsNullOrWhiteSpace(hostname) ? $"{vendor} Device" : hostname,
                    Vendor = vendor,
                    Category = InferCategory(vendor, hostname, openPorts),
                    IsOnline = true,
                    PingLatencyMs = latency,
                    OpenPorts = openPorts,
                    FirstDiscoveredUtc = DateTime.UtcNow,
                    LastSeenUtc = DateTime.UtcNow
                };

                db.Devices.Add(newDevice);
                await db.SaveChangesAsync(ct);
                existingDevices[macAddress] = newDevice;

                // Push to SignalR clients
                await _hubContext.Clients.Group("DashboardSubscribers")
                    .ReceiveDeviceDiscovered(newDevice);

                // Dispatch Alert for new unknown device
                await _alertDispatcher.DispatchAlertAsync(
                    "New Device Detected on Wi-Fi/LAN",
                    $"Host '{newDevice.CustomAlias}' ({ip}, MAC: {macAddress}, Vendor: {vendor}) joined the local network.",
                    AlertSeverity.Warning,
                    "ArpDiscoveryEngine"
                );
            }
        }

        // Check for devices that transitioned to offline
        var staleThreshold = DateTime.UtcNow.AddMinutes(-3);
        var staleDevices = await db.Devices
            .Where(d => d.IsOnline && d.LastSeenUtc < staleThreshold)
            .ToListAsync(ct);

        foreach (var stale in staleDevices)
        {
            stale.IsOnline = false;
            await _hubContext.Clients.Group("DashboardSubscribers")
                .ReceiveDeviceStatusChanged(stale.IpAddress, stale.MacAddress, false, 0);

            if (stale.Category == DeviceCategory.Infrastructure || stale.Category == DeviceCategory.Storage)
            {
                await _alertDispatcher.DispatchAlertAsync(
                    "Critical Infrastructure Device Offline!",
                    $"Device '{stale.CustomAlias}' ({stale.IpAddress}) has stopped responding to network sweeps.",
                    AlertSeverity.Critical,
                    "HealthMonitor"
                );
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task<Dictionary<string, string>> RetrieveArpCacheAsync(List<string> activeIps, CancellationToken ct)
    {
        var arpResults = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            // Windows: Use SendARP for active IPs
            foreach (var ipStr in activeIps)
            {
                if (IPAddress.TryParse(ipStr, out var ipAddress))
                {
                    byte[] macBytes = new byte[6];
                    uint len = (uint)macBytes.Length;
                    uint destIp = BitConverter.ToUInt32(ipAddress.GetAddressBytes(), 0);

                    uint res = SendARP(destIp, 0, macBytes, ref len);
                    if (res == 0 && len == 6)
                    {
                        var mac = string.Join(":", macBytes.Select(b => b.ToString("X2")));
                        arpResults[ipStr] = mac;
                    }
                }
            }
        }
        else
        {
            // Linux / Docker container: read /proc/net/arp
            const string arpFilePath = "/proc/net/arp";
            if (File.Exists(arpFilePath))
            {
                try
                {
                    var lines = await File.ReadAllLinesAsync(arpFilePath, ct);
                    // Format: IP address       HW type     Flags       HW address            Mask     Device
                    foreach (var line in lines.Skip(1))
                    {
                        var parts = line.Split([' ', '\t'], StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length >= 4)
                        {
                            var ip = parts[0];
                            var mac = parts[3].ToUpperInvariant();
                            if (mac != "00:00:00:00:00:00" && mac.Length == 17)
                            {
                                arpResults[ip] = mac;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to read /proc/net/arp, attempting fallback.");
                }
            }

            // Fallback: run `ip neigh` or `arp -a`
            if (arpResults.Count == 0)
            {
                await ReadArpFromProcessFallbackAsync(arpResults, ct);
            }
        }

        return arpResults;
    }

    private async Task ReadArpFromProcessFallbackAsync(Dictionary<string, string> arpResults, CancellationToken ct)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "ip",
                Arguments = "neigh show",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process != null)
            {
                string output = await process.StandardOutput.ReadToEndAsync(ct);
                await process.WaitForExitAsync(ct);

                // Example: 192.168.1.1 dev eth0 lladdr 24:5a:4c:11:22:33 REACHABLE
                var matches = Regex.Matches(output, @"(\d+\.\d+\.\d+\.\d+).*?lladdr\s+([0-9a-fA-F:]{17})");
                foreach (Match m in matches)
                {
                    arpResults[m.Groups[1].Value] = m.Groups[2].Value.ToUpperInvariant();
                }
            }
        }
        catch
        {
            // Ignore if utility unavailable in stripped Docker container
        }
    }

    public async Task<List<int>> ProbePortsAsync(string ip, IEnumerable<int> ports, int timeoutMs = 350, CancellationToken ct = default)
    {
        var openPorts = new ConcurrentBag<int>();

        var tasks = ports.Select(async port =>
        {
            try
            {
                using var client = new TcpClient();
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                cts.CancelAfter(timeoutMs);

                var connectTask = client.ConnectAsync(ip, port, cts.Token).AsTask();
                await connectTask;
                if (client.Connected)
                {
                    openPorts.Add(port);
                }
            }
            catch
            {
                // Port closed, filtered, or timeout
            }
        });

        await Task.WhenAll(tasks);
        return openPorts.OrderBy(p => p).ToList();
    }

    private static async Task<string> ResolveHostnameAsync(string ip)
    {
        try
        {
            var entry = await Dns.GetHostEntryAsync(ip);
            return entry.HostName ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    private async Task SendMulticastProbesAsync(CancellationToken ct)
    {
        try
        {
            // SSDP M-SEARCH broadcast
            using var udp = new UdpClient();
            udp.Client.ReceiveTimeout = 1500;
            var endpoint = new IPEndPoint(IPAddress.Parse("239.255.255.250"), 1900);
            var msearch = "M-SEARCH * HTTP/1.1\r\n" +
                          "HOST: 239.255.255.250:1900\r\n" +
                          "MAN: \"ssdp:discover\"\r\n" +
                          "MX: 1\r\n" +
                          "ST: ssdp:all\r\n\r\n";
            var bytes = Encoding.UTF8.GetBytes(msearch);
            await udp.SendAsync(bytes, bytes.Length, endpoint);
        }
        catch
        {
            // Multicast restricted or interface bound
        }
    }

    private static DeviceCategory InferCategory(string vendor, string hostname, List<int> ports)
    {
        var h = hostname.ToLowerInvariant();
        var v = vendor.ToLowerInvariant();

        if (ports.Contains(5000) || ports.Contains(5001) || v.Contains("synology") || v.Contains("western digital") ||
            h.Contains("nas") || h.Contains("truenas") || h.Contains("mycloud") || h.Contains("mybook"))
            return DeviceCategory.Storage;

        if (ports.Contains(8443) || v.Contains("ubiquiti") || v.Contains("cisco") || h.Contains("router") || h.Contains("udm") || h.Contains("gateway"))
            return DeviceCategory.Infrastructure;

        if (v.Contains("apple") || v.Contains("samsung") || h.Contains("iphone") || h.Contains("android") || h.Contains("galaxy"))
            return DeviceCategory.Mobile;

        if (v.Contains("espressif") || v.Contains("philips") || v.Contains("hue") || v.Contains("nest") || ports.Contains(8123) || ports.Contains(1883) || h.Contains("homeassistant"))
            return DeviceCategory.IoT;

        if (ports.Contains(22) || ports.Contains(3389) || v.Contains("intel") || v.Contains("dell") || v.Contains("lenovo"))
            return DeviceCategory.Workstation;

        return DeviceCategory.IoT;
    }

    private static string GenerateSyntheticMacForIp(string ip)
    {
        using var md5 = System.Security.Cryptography.MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(ip));
        // Ensure unicast / locally administered
        hash[0] = (byte)((hash[0] & 0xFE) | 0x02);
        return string.Join(":", hash.Take(6).Select(b => b.ToString("X2")));
    }

    private static List<string> GetActiveLocalSubnets()
    {
        var subnets = new List<string>();

        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.OperationalStatus != OperationalStatus.Up) continue;
            if (nic.NetworkInterfaceType is NetworkInterfaceType.Loopback or NetworkInterfaceType.Tunnel) continue;

            var label = $"{nic.Name} {nic.Description}".ToLowerInvariant();
            if (label.Contains("virtual") || label.Contains("hyper-v") || label.Contains("vmware") ||
                label.Contains("virtualbox") || label.Contains("wsl") || label.Contains("docker") ||
                label.Contains("loopback") || label.Contains("bluetooth"))
                continue;

            var ipProps = nic.GetIPProperties();
            if (ipProps.GatewayAddresses.Count == 0) continue; // not routed onto a real LAN

            foreach (var ua in ipProps.UnicastAddresses)
            {
                if (ua.Address.AddressFamily != AddressFamily.InterNetwork) continue;

                var bytes = ua.Address.GetAddressBytes();
                if (bytes[0] == 169 && bytes[1] == 254) continue; // APIPA (no real DHCP lease)
                if (bytes[0] == 127) continue; // loopback

                int prefixLength = ua.PrefixLength is > 0 and <= 32 ? ua.PrefixLength : 24;

                if (BitConverter.IsLittleEndian) Array.Reverse(bytes);
                uint ipNum = BitConverter.ToUInt32(bytes, 0);
                uint maskNum = prefixLength == 0 ? 0 : uint.MaxValue << (32 - prefixLength);
                uint network = ipNum & maskNum;

                var networkBytes = BitConverter.GetBytes(network);
                if (BitConverter.IsLittleEndian) Array.Reverse(networkBytes);

                subnets.Add($"{new IPAddress(networkBytes)}/{prefixLength}");
            }
        }

        return subnets.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static List<string> GenerateIpsFromCidr(string cidr)
    {
        var parts = cidr.Split('/');
        if (parts.Length != 2 || !IPAddress.TryParse(parts[0], out var baseIp) || !int.TryParse(parts[1], out var mask))
        {
            return ["192.168.1.1", "192.168.1.10", "192.168.1.15", "192.168.1.20", "192.168.1.50"];
        }

        if (mask == 32)
        {
            // Single host entry (e.g. a router on a different segment than any local NIC) - just probe it directly.
            return [baseIp.ToString()];
        }

        var ipBytes = baseIp.GetAddressBytes();
        if (BitConverter.IsLittleEndian) Array.Reverse(ipBytes);
        uint ipNum = BitConverter.ToUInt32(ipBytes, 0);

        uint maskNum = mask == 0 ? 0 : uint.MaxValue << (32 - mask);
        uint network = ipNum & maskNum;
        uint broadcast = network | ~maskNum;

        var result = new List<string>();
        // Scan up to 254 addresses for performance in standard class C
        uint count = Math.Min(broadcast - network - 1, 254);
        for (uint i = 1; i <= count; i++)
        {
            uint current = network + i;
            var currentBytes = BitConverter.GetBytes(current);
            if (BitConverter.IsLittleEndian) Array.Reverse(currentBytes);
            result.Add(new IPAddress(currentBytes).ToString());
        }

        return result;
    }
}
