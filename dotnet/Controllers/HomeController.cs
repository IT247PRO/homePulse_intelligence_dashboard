using HomePulse.Models;
using HomePulse.Models.ViewModels;
using HomePulse.Services;
using Microsoft.AspNetCore.Authentication;
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
    private readonly IEcobeeIntegrationService _ecobeeService;
    private readonly IBlinkIntegrationService _blinkService;
    private readonly ILogger<HomeController> _logger;

    public HomeController(
        HomePulseDbContext dbContext,
        ISpeedTestService speedTestService,
        IGoogleIntegrationService googleService,
        IEcobeeIntegrationService ecobeeService,
        IBlinkIntegrationService blinkService,
        ILogger<HomeController> logger)
    {
        _dbContext = dbContext;
        _speedTestService = speedTestService;
        _googleService = googleService;
        _ecobeeService = ecobeeService;
        _blinkService = blinkService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        var devices = await _dbContext.Devices.AsNoTracking()
            .OrderByDescending(d => d.IsOnline).ThenBy(d => d.IpAddress).ToListAsync(ct);
        var services = await _dbContext.Services.AsNoTracking().ToListAsync(ct);
        var nasNodes = await _dbContext.NasNodes.AsNoTracking().ToListAsync(ct);
        var alerts = await _dbContext.Alerts.AsNoTracking().OrderByDescending(a => a.TimestampUtc).Take(5).ToListAsync(ct);
        var latestSpeedTest = await _speedTestService.GetLatestResultAsync(ct);
        var speedTestHistory = await _dbContext.SpeedTestRecords.AsNoTracking()
            .OrderByDescending(r => r.TimestampUtc).Take(12).ToListAsync(ct);
        speedTestHistory.Reverse();

        int totalHosts = devices.Count;
        int onlineHosts = devices.Count(d => d.IsOnline);
        double avgLatency = devices.Where(d => d.IsOnline && d.PingLatencyMs > 0).Select(d => d.PingLatencyMs).DefaultIfEmpty(0).Average();
        double healthIndexPercent = totalHosts > 0 ? (double)onlineHosts / totalHosts * 100.0 : 100.0;

        // Google Calendar / Gmail widgets: only populated if the user actually granted those scopes at sign-in
        var accessToken = await HttpContext.GetTokenAsync("access_token") ?? "";
        var googleLinked = !string.IsNullOrWhiteSpace(accessToken);
        var calendarEvents = googleLinked
            ? await _googleService.GetTodayCalendarEventsAsync(accessToken, ct)
            : new List<GoogleCalendarEventSummary>();
        var mailHighlights = googleLinked
            ? await _googleService.GetMailHighlightsAsync(accessToken, ct)
            : null;

        var ecobeeConnected = await _ecobeeService.IsConnectedAsync(ct);
        var thermostats = ecobeeConnected ? await _ecobeeService.GetThermostatsAsync(ct) : new List<EcobeeThermostatSummary>();

        var blinkConnected = await _blinkService.IsConnectedAsync(ct);
        var blinkCameras = blinkConnected ? await _dbContext.BlinkCameras.AsNoTracking().ToListAsync(ct) : new List<BlinkCamera>();

        var viewModel = new DashboardViewModel
        {
            HealthIndexPercent = Math.Round(healthIndexPercent, 1),
            TotalDeviceCount = totalHosts,
            OnlineDeviceCount = onlineHosts,
            AverageLatencyMs = Math.Round(avgLatency, 1),
            LatestSpeedTest = latestSpeedTest,
            SpeedTestHistory = speedTestHistory,
            CriticalDevices = devices.Take(6).ToList(),
            ActiveAlerts = alerts,
            MonitoredServices = services,
            NasNodes = nasNodes,
            UserEmail = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value ?? "Unknown User",
            GoogleAccountLinked = googleLinked,
            CalendarEvents = calendarEvents,
            MailHighlights = mailHighlights,
            EcobeeConnected = ecobeeConnected,
            Thermostats = thermostats,
            BlinkConnected = blinkConnected,
            BlinkCameras = blinkCameras
        };

        return View(viewModel);
    }
}
