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
        var services = await _dbContext.MonitoredServices.AsNoTracking().ToListAsync(ct);
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
        if (ModelState.IsValid)
        {
            service.Id = Guid.NewGuid();
            service.LastCheckedUtc = DateTime.UtcNow;
            service.IsOnline = true;
            service.IsEnabled = true;
            _dbContext.MonitoredServices.Add(service);
            await _dbContext.SaveChangesAsync(ct);
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var s = await _dbContext.MonitoredServices.FindAsync(new object[] { id }, ct);
        if (s != null)
        {
            _dbContext.MonitoredServices.Remove(s);
            await _dbContext.SaveChangesAsync(ct);
        }
        return RedirectToAction(nameof(Index));
    }
}
