using HomePulse.Models;
using HomePulse.Models.ViewModels;
using HomePulse.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Controllers;

[Authorize(Policy = "WhitelistedGoogleEmailOnly")]
public class SpeedTestController : Controller
{
    private readonly HomePulseDbContext _dbContext;
    private readonly ISpeedTestService _speedTestService;

    public SpeedTestController(HomePulseDbContext dbContext, ISpeedTestService speedTestService)
    {
        _dbContext = dbContext;
        _speedTestService = speedTestService;
    }

    [HttpGet]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        var history = await _dbContext.SpeedTests.AsNoTracking().OrderByDescending(s => s.TimestampUtc).Take(15).ToListAsync(ct);
        var latest = history.FirstOrDefault() ?? await _speedTestService.GetLatestResultAsync(ct);

        var model = new SpeedTestViewModel
        {
            Latest = latest,
            History = history
        };
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Run(CancellationToken ct)
    {
        var result = await _speedTestService.ExecuteSpeedTestAsync(ct);
        return RedirectToAction(nameof(Index));
    }
}
