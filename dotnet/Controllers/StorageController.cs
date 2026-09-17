using HomePulse.Models;
using HomePulse.Models.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomePulse.Controllers;

[Authorize(Policy = "WhitelistedGoogleEmailOnly")]
public class StorageController : Controller
{
    private readonly HomePulseDbContext _dbContext;

    public StorageController(HomePulseDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        var nodes = await _dbContext.NasStorageNodes.AsNoTracking().ToListAsync(ct);
        var model = new StorageViewModel
        {
            Nodes = nodes,
            TotalAllocatedTb = Math.Round(nodes.Sum(n => n.DiskTotalBytes) / 1e12, 1),
            TotalUsedTb = Math.Round(nodes.Sum(n => n.DiskUsedBytes) / 1e12, 1)
        };
        return View(model);
    }
}
