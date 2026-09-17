using HomePulse.Models;
using HomePulse.Models.ViewModels;
using HomePulse.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Controllers;

[Authorize(Policy = "WhitelistedGoogleEmailOnly")]
public class DevicesController : Controller
{
    private readonly HomePulseDbContext _dbContext;
    private readonly ILogger<DevicesController> _logger;

    public DevicesController(HomePulseDbContext dbContext, ILogger<DevicesController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Index(string? category, string? search, CancellationToken ct)
    {
        var query = _dbContext.Devices.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<DeviceCategory>(category, true, out var cat))
        {
            query = query.Where(d => d.Category == cat);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLowerInvariant();
            query = query.Where(d => d.CustomAlias.ToLower().Contains(search) ||
                                     d.IpAddress.Contains(search) ||
                                     d.MacAddress.ToLower().Contains(search) ||
                                     d.Vendor.ToLower().Contains(search));
        }

        var devices = await query.OrderBy(d => d.IpAddress).ToListAsync(ct);

        var model = new DeviceListViewModel
        {
            Devices = devices,
            SelectedCategory = category ?? "All",
            SearchQuery = search ?? string.Empty
        };

        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Update([FromForm] NetworkDevice updatedDevice, CancellationToken ct)
    {
        var existing = await _dbContext.Devices.FirstOrDefaultAsync(d => d.Id == updatedDevice.Id, ct);
        if (existing == null) return NotFound();

        existing.CustomAlias = updatedDevice.CustomAlias;
        existing.Category = updatedDevice.Category;
        existing.Notes = updatedDevice.Notes;
        existing.IsWhitelisted = updatedDevice.IsWhitelisted;
        existing.IsAlertMuted = updatedDevice.IsAlertMuted;

        await _dbContext.SaveChangesAsync(ct);
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Forget(Guid id, CancellationToken ct)
    {
        var existing = await _dbContext.Devices.FindAsync(new object[] { id }, ct);
        if (existing != null)
        {
            _dbContext.Devices.Remove(existing);
            await _dbContext.SaveChangesAsync(ct);
        }
        return RedirectToAction(nameof(Index));
    }
}
