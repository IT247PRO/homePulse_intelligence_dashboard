using HomePulse.Models;
using HomePulse.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Controllers;

[Authorize(Policy = "WhitelistedGoogleEmailOnly")]
public class ServicesController : Controller
{
    private readonly HomePulseDbContext _dbContext;

    public ServicesController(HomePulseDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        var services = await _dbContext.Services.AsNoTracking().ToListAsync(ct);
        var model = new ServiceHealthViewModel
        {
            Services = services
        };
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create([FromForm] MonitoredService service, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(service.TargetUrl) &&
            !service.TargetUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !service.TargetUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            service.TargetUrl = "https://" + service.TargetUrl;
        }

        if (service.ExpectedStatusCode <= 0) service.ExpectedStatusCode = 200;
        if (service.CheckIntervalSeconds <= 0) service.CheckIntervalSeconds = 60;

        if (!string.IsNullOrWhiteSpace(service.Name) &&
            Uri.TryCreate(service.TargetUrl, UriKind.Absolute, out _))
        {
            service.Id = Guid.NewGuid();
            service.LastCheckedUtc = DateTime.UtcNow;
            service.IsOnline = true;
            service.IsEnabled = true;
            _dbContext.Services.Add(service);
            await _dbContext.SaveChangesAsync(ct);
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var s = await _dbContext.Services.FindAsync(new object[] { id }, ct);
        if (s != null)
        {
            _dbContext.Services.Remove(s);
            await _dbContext.SaveChangesAsync(ct);
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleEnabled(Guid id, CancellationToken ct)
    {
        var s = await _dbContext.Services.FindAsync(new object[] { id }, ct);
        if (s != null)
        {
            s.IsEnabled = !s.IsEnabled;
            await _dbContext.SaveChangesAsync(ct);
        }
        return RedirectToAction(nameof(Index));
    }
}
