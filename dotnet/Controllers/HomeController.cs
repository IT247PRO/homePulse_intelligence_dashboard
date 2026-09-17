using HomePulse.Models;
using HomePulse.Models.ViewModels;
using HomePulse.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Controllers;

[Authorize(Policy = "WhitelistedGoogleEmailOnly")]
public class HomeController : Controller
{
    private readonly HomePulseDbContext _dbContext;
    private readonly ISpeedTestService _speedTestService;
    private readonly IGoogleIntegrationService _googleService;
    private readonly ILogger<HomeController> _logger;

    public HomeController(
        HomePulseDbContext dbContext,
        ISpeedTestService speedTestService,
        IGoogleIntegrationService googleService,
        ILogger<HomeController> logger)
    {
        _dbContext = dbContext;
        _speedTestService = speedTestService;
        _googleService = googleService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        var devices = await _dbContext.Devices.AsNoTracking().ToListAsync(ct);
        var services = await _dbContext.MonitoredServices.AsNoTracking().ToListAsync(ct);
        var nasNodes = await _dbContext.NasStorageNodes.AsNoTracking().ToListAsync(ct);
        var alerts = await _dbContext.Alerts.AsNoTracking().OrderByDescending(a => a.TimestampUtc).Take(5).ToListAsync(ct);
        var latestSpeedTest = await _speedTestService.GetLatestResultAsync(ct);

        int totalHosts = devices.Count;
        int onlineHosts = devices.Count(d => d.IsOnline);
        double avgLatency = devices.Where(d => d.IsOnline && d.PingLatencyMs > 0).Select(d => d.PingLatencyMs).DefaultIfEmpty(0).Average();
        double healthIndexPercent = totalHosts > 0 ? (double)onlineHosts / totalHosts * 100.0 : 100.0;

        var viewModel = new DashboardViewModel
        {
            HealthIndexPercent = Math.Round(healthIndexPercent, 1),
            TotalDeviceCount = totalHosts,
            OnlineDeviceCount = onlineHosts,
            AverageLatencyMs = Math.Round(avgLatency, 1),
            LatestSpeedTest = latestSpeedTest,
            CriticalDevices = devices.Take(6).ToList(),
            ActiveAlerts = alerts,
            MonitoredServices = services,
            NasNodes = nasNodes,
            UserEmail = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value ?? "azhar.cs@gmail.com"
        };

        return View(viewModel);
    }
}
