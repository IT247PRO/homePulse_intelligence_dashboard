using HomePulse.Models.ViewModels;
using HomePulse.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomePulse.Controllers;

[Authorize(Policy = "WhitelistedGoogleEmailOnly")]
public class IntegrationsController : Controller
{
    private readonly IEcobeeIntegrationService _ecobee;
    private readonly IBlinkIntegrationService _blink;

    public IntegrationsController(IEcobeeIntegrationService ecobee, IBlinkIntegrationService blink)
    {
        _ecobee = ecobee;
        _blink = blink;
    }

    [HttpGet]
    public async Task<IActionResult> Index(CancellationToken ct)
    {
        var model = new IntegrationsViewModel
        {
            EcobeeConnected = await _ecobee.IsConnectedAsync(ct),
            BlinkConnected = await _blink.IsConnectedAsync(ct)
        };
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> EcobeeConnect(CancellationToken ct)
    {
        try
        {
            var result = await _ecobee.StartAuthorizationAsync(ct);
            TempData["EcobeePin"] = result.Pin;
            TempData["EcobeeMessage"] = $"Enter this PIN at ecobee.com/consumerportal (My Apps) within {result.ExpiresInMinutes} minutes, then click \"Finish Connecting\".";
        }
        catch (Exception ex)
        {
            TempData["EcobeeMessage"] = ex.Message;
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> EcobeeComplete(CancellationToken ct)
    {
        var (success, message) = await _ecobee.CompleteAuthorizationAsync(ct);
        TempData["EcobeeMessage"] = message;
        if (!success) TempData["EcobeePin"] = null;
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> EcobeeDisconnect(CancellationToken ct)
    {
        await _ecobee.DisconnectAsync(ct);
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> BlinkLogin(string email, string password, CancellationToken ct)
    {
        var result = await _blink.LoginAsync(email, password, ct);
        TempData["BlinkMessage"] = result.Message;
        TempData["BlinkNeedsPin"] = result.Outcome == BlinkLoginOutcome.NeedsPinVerification;
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> BlinkVerifyPin(string pin, CancellationToken ct)
    {
        var result = await _blink.VerifyPinAsync(pin, ct);
        TempData["BlinkMessage"] = result.Message;
        TempData["BlinkNeedsPin"] = result.Outcome == BlinkLoginOutcome.NeedsPinVerification;
        if (result.Outcome == BlinkLoginOutcome.Connected)
        {
            await _blink.RefreshCameraStatusAsync(ct);
        }
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> BlinkDisconnect(CancellationToken ct)
    {
        await _blink.DisconnectAsync(ct);
        return RedirectToAction(nameof(Index));
    }
}
