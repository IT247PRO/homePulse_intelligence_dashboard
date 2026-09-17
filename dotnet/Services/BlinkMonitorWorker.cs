namespace HomePulse.Services;

public class BlinkMonitorWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BlinkMonitorWorker> _logger;

    public BlinkMonitorWorker(IServiceProvider serviceProvider, ILogger<BlinkMonitorWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(10000, stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var blink = scope.ServiceProvider.GetRequiredService<IBlinkIntegrationService>();
                if (await blink.IsConnectedAsync(stoppingToken))
                {
                    await blink.RefreshCameraStatusAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while refreshing Blink camera status.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
