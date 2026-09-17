# HomePulse Enterprise Home Intelligence & Network Monitoring Architecture

HomePulse is an enterprise-grade home intelligence and network monitoring system designed for self-hosting across Linux, Docker, and Windows environments.

## Core Architectural Pillars

1. **ASP.NET Core 9 Minimal APIs & SignalR**:
   - High-throughput asynchronous pipeline with structured endpoint groups.
   - Real-time bidirectional event streaming via `/hubs/network` utilizing `IDashboardClient`.
2. **Strict Google OAuth 2.0 & Email Whitelisting**:
   - Powered by `Microsoft.AspNetCore.Authentication.Google` and `EmailWhitelistHandler`.
   - Explicit whitelist configured in `appsettings.json` (`Security:AllowedGoogleEmails`).
3. **Multi-Engine Network Discovery**:
   - **Cross-Platform ARP**: Windows `SendARP` P/Invoke and Linux/Docker `/proc/net/arp` / `ip neigh` parsing.
   - **Throttled Ping Sweeper**: `SemaphoreSlim(32)` throttling across CIDR blocks.
   - **In-Memory OUI Vendor Lookup**: High-performance MAC 24-bit OUI resolution.
   - **Light TCP Fingerprinting**: Probing ports (22, 80, 443, 445, 8080, 9000).
4. **Resilient Alerts & Webhooks**:
   - Formatted embeds for Discord, Markdown for Telegram, and priority tags for `ntfy.sh`.
5. **Storage & Service Health**:
   - Synology / TrueNAS RAID & drive temperature monitoring.
   - SSL certificate expiration alert (< 7 days).

## Quickstart

```bash
# Clone and run with Docker
docker compose up -d --build

# Or run directly via .NET 9 SDK
dotnet restore
dotnet run
```
