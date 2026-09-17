using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Gmail.v1;
using Google.Apis.Services;

namespace HomePulse.Services;

public record GoogleCalendarEventSummary(
    string Id,
    string Summary,
    DateTime StartTime,
    DateTime EndTime,
    bool IsAllDay,
    string? Location,
    string? HtmlLink,
    string? ConferenceLink
);

public record GoogleMailHighlightsSummary(
    int UnreadPrimaryCount,
    int HighPriorityUnreadCount,
    List<GoogleMailSnippet> RecentImportantMessages
);

public record GoogleMailSnippet(
    string Id,
    string From,
    string Subject,
    string Snippet,
    DateTime ReceivedUtc
);

public interface IGoogleIntegrationService
{
    Task<List<GoogleCalendarEventSummary>> GetTodayCalendarEventsAsync(string userAccessToken, CancellationToken ct = default);
    Task<GoogleMailHighlightsSummary> GetMailHighlightsAsync(string userAccessToken, CancellationToken ct = default);
}

public class GoogleIntegrationService : IGoogleIntegrationService
{
    private readonly ILogger<GoogleIntegrationService> _logger;

    public GoogleIntegrationService(ILogger<GoogleIntegrationService> logger)
    {
        _logger = logger;
    }

    public async Task<List<GoogleCalendarEventSummary>> GetTodayCalendarEventsAsync(string userAccessToken, CancellationToken ct = default)
    {
        var result = new List<GoogleCalendarEventSummary>();

        if (string.IsNullOrWhiteSpace(userAccessToken))
        {
            _logger.LogWarning("Google OAuth access token is empty or expired.");
            return result;
        }

        try
        {
            var credential = GoogleCredential.FromAccessToken(userAccessToken);
            using var calendarService = new CalendarService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "HomePulse Home Intelligence Sentinel"
            });

            var startOfDay = DateTime.UtcNow.Date;
            var endOfDay = startOfDay.AddDays(1).AddTicks(-1);

            var request = calendarService.Events.List("primary");
            request.TimeMinDateTimeOffset = startOfDay;
            request.TimeMaxDateTimeOffset = endOfDay;
            request.ShowDeleted = false;
            request.SingleEvents = true;
            request.OrderBy = EventsResource.ListRequest.OrderByEnum.StartTime;

            var events = await request.ExecuteAsync(ct);

            if (events.Items != null)
            {
                foreach (var item in events.Items)
                {
                    DateTime start = item.Start.DateTimeDateTimeOffset?.UtcDateTime 
                                     ?? DateTime.Parse(item.Start.Date ?? DateTime.UtcNow.ToString("yyyy-MM-dd"));
                    DateTime end = item.End.DateTimeDateTimeOffset?.UtcDateTime 
                                   ?? DateTime.Parse(item.End.Date ?? DateTime.UtcNow.ToString("yyyy-MM-dd"));
                    bool isAllDay = item.Start.DateTimeRaw == null;

                    string? conference = item.ConferenceData?.EntryPoints?.FirstOrDefault(e => e.EntryPointType == "video")?.Uri;

                    result.Add(new GoogleCalendarEventSummary(
                        item.Id ?? Guid.NewGuid().ToString(),
                        item.Summary ?? "Untitled Event",
                        start,
                        end,
                        isAllDay,
                        item.Location,
                        item.HtmlLink,
                        conference
                    ));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch Google Calendar events via API v3.");
        }

        return result;
    }

    public async Task<GoogleMailHighlightsSummary> GetMailHighlightsAsync(string userAccessToken, CancellationToken ct = default)
    {
        var snippets = new List<GoogleMailSnippet>();
        int primaryUnreadCount = 0;

        if (string.IsNullOrWhiteSpace(userAccessToken))
        {
            return new GoogleMailHighlightsSummary(0, 0, snippets);
        }

        try
        {
            var credential = GoogleCredential.FromAccessToken(userAccessToken);
            using var gmailService = new GmailService(new BaseClientService.Initializer
            {
                HttpClientInitializer = credential,
                ApplicationName = "HomePulse Home Intelligence Sentinel"
            });

            // 1. Query for unread primary inbox messages
            var listReq = gmailService.Users.Messages.List("me");
            listReq.Q = "is:unread category:primary";
            listReq.MaxResults = 10;

            var messageList = await listReq.ExecuteAsync(ct);
            primaryUnreadCount = messageList.Messages?.Count ?? 0;

            if (messageList.Messages != null)
            {
                foreach (var m in messageList.Messages.Take(5))
                {
                    var msgDetailsReq = gmailService.Users.Messages.Get("me", m.Id);
                    msgDetailsReq.Format = UsersResource.MessagesResource.GetRequest.FormatEnum.Metadata;
                    msgDetailsReq.MetadataHeaders = new Google.Apis.Util.Repeatable<string>(new[] { "From", "Subject", "Date" });

                    var details = await msgDetailsReq.ExecuteAsync(ct);

                    var fromHeader = details.Payload?.Headers?.FirstOrDefault(h => h.Name.Equals("From", StringComparison.OrdinalIgnoreCase))?.Value ?? "Unknown Sender";
                    var subjectHeader = details.Payload?.Headers?.FirstOrDefault(h => h.Name.Equals("Subject", StringComparison.OrdinalIgnoreCase))?.Value ?? "(No Subject)";

                    snippets.Add(new GoogleMailSnippet(
                        m.Id,
                        fromHeader,
                        subjectHeader,
                        details.Snippet ?? "",
                        DateTime.UtcNow
                    ));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve Gmail highlights via API v1.");
        }

        return new GoogleMailHighlightsSummary(primaryUnreadCount, snippets.Count, snippets);
    }
}
