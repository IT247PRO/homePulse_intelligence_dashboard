using HomePulse.Models;
using HomePulse.Models.ViewModels;
using HomePulse.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Controllers;

[Authorize(Policy = "WhitelistedGoogleEmailOnly")]
public class AlertsController : Controller
{
    private readonly HomePulseDbContext _dbContext;
    private readonly IAlertDispatcherService _alertService;

    public AlertsController(HomePulseDbContext dbContext, IAlertDispatcherService alertService)
    {
        _dbContext = dbContext;
        _alertService = alertService;
    }

    [HttpGet]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        var alerts = await _dbContext.Alerts.AsNoTracking().OrderByDescending(a => a.TimestampUtc).ToListAsync(ct);
        var model = new AlertsViewModel
        {
            Alerts = alerts
        };
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleResolve(Guid id, CancellationToken ct)
    {
        var alert = await _dbContext.Alerts.FindAsync(new object[] { id }, ct);
        if (alert != null)
        {
            alert.IsResolved = !alert.IsResolved;
            await _dbContext.SaveChangesAsync(ct);
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DispatchTestAlert(CancellationToken ct)
    {
        await _alertService.DispatchAlertAsync(
            "Manual Test: Wi-Fi Rogue Client Association",
            "Unrecognized hardware MAC DC:A6:32:99:FF:01 associated with SSID 'IoT_Isolated'.",
            AlertSeverity.Warning,
            "Manual MVC Trigger");

        return RedirectToAction(nameof(Index));
    }
}
