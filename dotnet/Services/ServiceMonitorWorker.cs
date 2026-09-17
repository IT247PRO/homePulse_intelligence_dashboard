using System.Diagnostics;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using HomePulse.Hubs;
using HomePulse.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Services;

public class ServiceMonitorWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IAlertDispatcherService _alertDispatcher;
    private readonly IHubContext<DashboardHub, IDashboardClient> _hubContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ServiceMonitorWorker> _logger;

    public ServiceMonitorWorker(
        IServiceProvider serviceProvider,
        IAlertDispatcherService alertDispatcher,
        IHubContext<DashboardHub, IDashboardClient> hubContext,
        IConfiguration configuration,
        ILogger<ServiceMonitorWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _alertDispatcher = alertDispatcher;
        _hubContext = hubContext;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(5000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckMonitoredServicesAsync(stoppingToken);
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while checking monitored services.");
                await Task.Delay(15000, stoppingToken);
            }
        }
    }

    public async Task CheckMonitoredServicesAsync(CancellationToken ct = default)
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
        var services = await db.Services.Where(s => s.IsEnabled).ToListAsync(ct);

        int sslWarningDays = _configuration.GetValue("Alerting:SslWarningDaysThreshold", 7);

        foreach (var service in services)
        {
            if (ct.IsCancellationRequested) break;

            DateTime? sslExpiry = null;

            var handler = new HttpClientHandler
            {
                ServerCertificateCustomValidationCallback = (req, cert, chain, errors) =>
                {
                    if (cert != null)
                    {
                        sslExpiry = cert.NotAfter.ToUniversalTime();
                    }
                    return true; // continue even if self-signed in home lab
                }
            };

            using var client = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(10) };
            var sw = Stopwatch.StartNew();

            try
            {
                var response = await client.GetAsync(service.TargetUrl, ct);
                sw.Stop();

                service.LastStatusCode = (int)response.StatusCode;
                service.ResponseLatencyMs = Math.Round(sw.Elapsed.TotalMilliseconds, 1);
                service.IsOnline = (service.LastStatusCode == service.ExpectedStatusCode);
                service.LastCheckedUtc = DateTime.UtcNow;

                if (sslExpiry.HasValue)
                {
                    service.SslCertExpiryUtc = sslExpiry.Value;
                    int daysLeft = (int)(sslExpiry.Value - DateTime.UtcNow).TotalDays;
                    service.SslDaysRemaining = daysLeft;

                    if (daysLeft < sslWarningDays && daysLeft >= 0)
                    {
                        await _alertDispatcher.DispatchAlertAsync(
                            $"SSL Certificate Expiring Soon: {service.Name}",
                            $"Certificate for {service.TargetUrl} expires in {daysLeft} days ({sslExpiry:yyyy-MM-dd}). Renew urgently!",
                            AlertSeverity.Warning,
                            "SslSentinel"
                        );
                    }
                }

                await db.SaveChangesAsync(ct);
                await _hubContext.Clients.Group("DashboardSubscribers").ReceiveServiceHealth(service);
            }
            catch (Exception ex)
            {
                sw.Stop();
                service.IsOnline = false;
                service.LastStatusCode = 0;
                service.ResponseLatencyMs = Math.Round(sw.Elapsed.TotalMilliseconds, 1);
                service.LastCheckedUtc = DateTime.UtcNow;

                await db.SaveChangesAsync(ct);
                await _hubContext.Clients.Group("DashboardSubscribers").ReceiveServiceHealth(service);

                _logger.LogWarning("Service {Name} ({Url}) ping failed: {Message}", service.Name, service.TargetUrl, ex.Message);
            }
        }
    }
}
