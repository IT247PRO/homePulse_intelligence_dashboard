using System.Text;
using System.Text.Json;
using HomePulse.Hubs;
using HomePulse.Models;
using Microsoft.AspNetCore.SignalR;

namespace HomePulse.Services;

public interface IAlertDispatcherService
{
    Task DispatchAlertAsync(string title, string message, AlertSeverity severity, string source);
    Task TestWebhooksAsync();
}

public class AlertDispatcherService : IAlertDispatcherService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IHubContext<DashboardHub, IDashboardClient> _hubContext;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AlertDispatcherService> _logger;

    public AlertDispatcherService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IHubContext<DashboardHub, IDashboardClient> hubContext,
        IServiceProvider serviceProvider,
        ILogger<AlertDispatcherService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _hubContext = hubContext;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task DispatchAlertAsync(string title, string message, AlertSeverity severity, string source)
    {
        var alert = new SystemAlert
        {
            Title = title,
            Message = message,
            Severity = severity,
            Source = source,
            TimestampUtc = DateTime.UtcNow
        };

        var dispatchedTargets = new List<string>();

        // 1. Broadcast to SignalR client UI immediately
        try
        {
            await _hubContext.Clients.Group("DashboardSubscribers").ReceiveAlert(alert);
            dispatchedTargets.Add("SignalR_UI");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast alert to SignalR clients.");
        }

        // 2. Dispatch to Discord
        var discordUrl = _configuration["Alerting:DiscordWebhookUrl"];
        if (!string.IsNullOrWhiteSpace(discordUrl))
        {
            var sent = await SendDiscordAlertAsync(discordUrl, alert);
            if (sent) dispatchedTargets.Add("Discord");
        }

        // 3. Dispatch to Telegram
        var telegramToken = _configuration["Alerting:TelegramBotToken"];
        var telegramChatId = _configuration["Alerting:TelegramChatId"];
        if (!string.IsNullOrWhiteSpace(telegramToken) && !string.IsNullOrWhiteSpace(telegramChatId))
        {
            var sent = await SendTelegramAlertAsync(telegramToken, telegramChatId, alert);
            if (sent) dispatchedTargets.Add("Telegram");
        }

        // 4. Dispatch to ntfy.sh
        var ntfyTopic = _configuration["Alerting:NtfyTopic"];
        if (!string.IsNullOrWhiteSpace(ntfyTopic))
        {
            var sent = await SendNtfyAlertAsync(ntfyTopic, alert);
            if (sent) dispatchedTargets.Add("ntfy.sh");
        }

        alert.DispatchedWebhooksJson = JsonSerializer.Serialize(dispatchedTargets);

        // 5. Persist to EF Core Database
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<HomePulseDbContext>();
            db.Alerts.Add(alert);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save alert {Title} to database.", title);
        }
    }

    public async Task TestWebhooksAsync()
    {
        await DispatchAlertAsync(
            "Test Alert: Enterprise Notification Engine",
            "This is a test notification dispatched from HomePulse Network Monitor.",
            AlertSeverity.Info,
            "Diagnostics"
        );
    }

    private async Task<bool> SendDiscordAlertAsync(string webhookUrl, SystemAlert alert)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            int color = alert.Severity switch
            {
                AlertSeverity.Critical => 0xE74C3C, // Red
                AlertSeverity.Warning => 0xF39C12,  // Orange
                _ => 0x3498DB                       // Blue
            };

            var payload = new
            {
                username = "HomePulse Network Sentinel",
                embeds = new[]
                {
                    new
                    {
                        title = $"[{alert.Severity.ToString().ToUpper()}] {alert.Title}",
                        description = alert.Message,
                        color,
                        fields = new[]
                        {
                            new { name = "Source", value = alert.Source, @inline = true },
                            new { name = "Timestamp (UTC)", value = alert.TimestampUtc.ToString("yyyy-MM-dd HH:mm:ss"), @inline = true }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(webhookUrl, content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Discord webhook dispatch failed.");
            return false;
        }
    }

    private async Task<bool> SendTelegramAlertAsync(string botToken, string chatId, SystemAlert alert)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var emoji = alert.Severity switch
            {
                AlertSeverity.Critical => "🚨",
                AlertSeverity.Warning => "⚠️",
                _ => "ℹ️"
            };

            var text = $"{emoji} *HomePulse Alert: {alert.Title}*\n\n{alert.Message}\n\n*Severity:* `{alert.Severity}`\n*Source:* `{alert.Source}`";
            var url = $"https://api.telegram.org/bot{botToken}/sendMessage";
            var payload = new
            {
                chat_id = chatId,
                text,
                parse_mode = "Markdown"
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(url, content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Telegram alert dispatch failed.");
            return false;
        }
    }

    private async Task<bool> SendNtfyAlertAsync(string topic, SystemAlert alert)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var priority = alert.Severity switch
            {
                AlertSeverity.Critical => "urgent",
                AlertSeverity.Warning => "high",
                _ => "default"
            };

            var request = new HttpRequestMessage(HttpMethod.Post, $"https://ntfy.sh/{topic}")
            {
                Content = new StringContent(alert.Message, Encoding.UTF8, "text/plain")
            };
            request.Headers.Add("Title", alert.Title);
            request.Headers.Add("Priority", priority);
            request.Headers.Add("Tags", alert.Severity == AlertSeverity.Critical ? "warning,rotating_light" : "white_check_mark");

            var response = await client.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ntfy.sh alert dispatch failed.");
            return false;
        }
    }
}
