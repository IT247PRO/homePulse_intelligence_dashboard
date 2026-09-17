# HomePulse — Enterprise Home Intelligence & Network Monitoring Dashboard

[![.NET 9](https://img.shields.io/badge/.NET-9.0_LTS-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![ASP.NET Core MVC](https://img.shields.io/badge/ASP.NET_Core-MVC_%26_SignalR-2072B8?logo=csharp&logoColor=white)](https://learn.microsoft.com/aspnet/core/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Linux_Host_Net-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Google OAuth 2.0](https://img.shields.io/badge/Auth-Google_OAuth_2.0_Whitelist-4285F4?logo=google&logoColor=white)](https://developers.google.com/identity)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

**HomePulse** is a production-grade, self-hosted Enterprise Home Intelligence and Network Telemetry Platform engineered with **ASP.NET Core 9 MVC**, **SignalR**, and **C# 13**. Designed for homelabs, enterprise home offices, and multi-VLAN private residences, HomePulse provides real-time device discovery, ICMP/ARP telemetry, interactive SVG gauges, NAS RAID health monitoring, WAN speed benchmarking, multi-channel webhook alert dispatching, and a natural-language **Network Intelligence Copilot Chat**.

---

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Key Features](#key-features)
  - [1. Strict Google OAuth 2.0 & Email Whitelisting](#1-strict-google-oauth-20--email-whitelisting)
  - [2. Multi-Engine Network Discovery](#2-multi-engine-network-discovery)
  - [3. Real-Time Telemetry & SVG Gauges Suite](#3-real-time-telemetry--svg-gauges-suite)
  - [4. Network Intelligence Copilot Chat](#4-network-intelligence-copilot-chat)
  - [5. NAS & Storage Telemetry (Synology & TrueNAS)](#5-nas--storage-telemetry-synology--truenas)
  - [6. WAN Gigabit Bandwidth & Speed Daemon](#6-wan-gigabit-bandwidth--speed-daemon)
  - [7. Resilient Multi-Channel Alert Engine](#7-resilient-multi-channel-alert-engine)
- [System Requirements & Tools](#system-requirements--tools)
- [Quick Start Guide](#quick-start-guide)
  - [Option A: Docker Compose (Recommended)](#option-a-docker-compose-recommended)
  - [Option B: Bare-Metal .NET 9 SDK](#option-b-bare-metal-net-9-sdk)
  - [Option C: Vite / React Preview Mode](#option-c-vite--react-preview-mode)
- [Configuration Reference (`appsettings.json`)](#configuration-reference-appsettingsjson)
- [Google OAuth 2.0 Setup Guide](#google-oauth-20-setup-guide)
- [SignalR Telemetry Hub Protocol](#signalr-telemetry-hub-protocol)
- [Repository & Solution Structure](#repository--solution-structure)
- [Security & Hardening Checklist](#security--hardening-checklist)
- [License](#license)

---

## Architectural Overview

HomePulse follows a robust, decoupled enterprise architecture with real-time push capabilities:

```
                                  +-------------------------------------------------------+
                                  |                    User Browser                       |
                                  |  (Razor MVC Views + Tailwind CSS + SVG Gauges + Chat) |
                                  +---------------------------+---------------------------+
                                                              ^
                                        HTTP/2 (HTTPS)        | WebSocket (SignalR)
                                        Google OAuth 2.0      | Strongly-Typed RPC Hub
                                                              v
+-------------------------------------------------------------+-----------------------------------------------------------+
|                                              ASP.NET Core 9 Backend Runtime                                             |
|                                                                                                                         |
|  +---------------------------+  +--------------------------------+  +------------------------------------------------+  |
|  |     MVC Controllers       |  |       Security Middleware      |  |             SignalR Event Hub                  |  |
|  |  - HomeController         |  |  - CookieAuthenticationScheme  |  |  - DashboardHub : Hub<IDashboardClient>        |  |
|  |  - DevicesController      |  |  - GoogleDefaults (OAuth 2.0)  |  |    * ReceivePingLatency()                      |  |
|  |  - StorageController      |  |  - EmailWhitelistHandler       |  |    * ReceiveDeviceDiscovered()                 |  |
|  |  - ServicesController     |  |    (Policy: azhar.cs@gmail.com)|  |    * ReceiveAlert()                            |  |
|  |  - SpeedTestController    |  +--------------------------------+  |    * ReceiveSpeedTestResult()                  |  |
|  |  - AlertsController       |                                      +------------------------------------------------+  |
|  |  - ChatController         |                                                                                          |
|  +---------------------------+                                                                                          |
|                                                                                                                         |
|  +-------------------------------------------------------------------------------------------------------------------+  |
|  |                                          Background Hosted Services                                               |  |
|  |  - NetworkScannerService  : Multi-threaded ARP / ICMP ping sweeper (SemaphoreSlim(32) across CIDR subnets)         |  |
|  |  - ServiceMonitorWorker   : TLS / SSL certificate validator & HTTP status probe (every 60 seconds)                 |  |
|  |  - SpeedTestService       : Scheduled 4-hour WAN bandwidth daemon (Cloudflare / Ookla Edge PoPs)                    |  |
|  +-------------------------------------------------------------------------------------------------------------------+  |
|                                                                                                                         |
|  +---------------------------+  +--------------------------------+  +------------------------------------------------+  |
|  |      Data Access Layer    |  |     Hardware / Vendor Lookup   |  |           Multi-Channel Dispatcher             |  |
|  |  - HomePulseDbContext     |  |  - OUIVendorLookup             |  |  - Discord Webhooks (rich embeds)              |  |
|  |  - SQLite / PostgreSQL    |  |    (In-memory IEEE OUI trie)   |  |  - Telegram Bot API (Markdown)                 |  |
|  |  - Migrations Engine      |  |  - Cross-platform ARP resolver |  |  - ntfy.sh (Unified push notifications)       |  |
|  +---------------------------+  +--------------------------------+  +------------------------------------------------+  |
+-------------------------------------------------------------+-----------------------------------------------------------+
                                                              |
                               Raw Socket / ICMP / ARP Engine | (Host Network Mode)
                                                              v
+-------------------------------------------------------------------------------------------------------------------------+
|                                              Local Physical Subnet (LAN)                                                |
|   192.168.1.1 (Gateway)   *   192.168.1.50 (Synology NAS)   *   192.168.1.51 (TrueNAS)   *   IoT / Mobile Fleet     |
+-------------------------------------------------------------------------------------------------------------------------+
```

---

## Key Features

### 1. Strict Google OAuth 2.0 & Email Whitelisting
- Authenticates users solely through **Google OpenID Connect / OAuth 2.0** (`Microsoft.AspNetCore.Authentication.Google`).
- Zero password attack surface; relies on Google's high-grade authentication infrastructure (including FIDO2 / hardware 2FA keys).
- Enforces an explicit, immutable email whitelist configured via `appsettings.json` using a custom ASP.NET Core authorization requirement:
  ```csharp
  // Security/EmailWhitelistHandler.cs
  public class EmailWhitelistHandler : AuthorizationHandler<EmailWhitelistRequirement>
  {
      protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, EmailWhitelistRequirement req)
      {
          var email = context.User.FindFirst(ClaimTypes.Email)?.Value;
          if (email != null && req.AllowedEmails.Contains(email, StringComparer.OrdinalIgnoreCase))
          {
              context.Succeed(req);
          }
          return Task.CompletedTask;
      }
  }
  ```
- Any unauthorized authenticated Google account is rejected with HTTP 403 Forbidden and logged as a security audit event.

### 2. Multi-Engine Network Discovery
- **Cross-Platform ARP Engine**:
  - **Linux / Docker**: Reads `/proc/net/arp` and queries `ip neigh show` to resolve MAC addresses across network segments.
  - **Windows**: Executes high-speed kernel P/Invoke calls to `iphlpapi.dll` via `SendARP`.
- **Throttled CIDR Ping Sweeper**: Sweeps target subnets (e.g., `192.168.1.0/24`) using an asynchronous `SemaphoreSlim(32)` pool, completing a full 254-host class-C discovery sweep in under 3.2 seconds without exhausting kernel socket descriptors.
- **In-Memory OUI Vendor Lookup**: Parses IEEE 24-bit MAC address prefixes into human-readable manufacturer names (Apple, Raspberry Pi Foundation, Ubiquiti, Synology, Espressif, Intel, etc.).
- **Lightweight TCP Port Fingerprinting**: Non-blocking asynchronous TCP handshakes across critical infrastructure ports (`22` SSH, `80` HTTP, `443` HTTPS, `445` SMB, `3000` Dev, `8080` Proxy, `8123` Home Assistant, `9000` Portainer).

### 3. Real-Time Telemetry & SVG Gauges Suite
Mathematical, zero-dependency inline SVG gauges styled via Tailwind CSS:
- **Radial Arc Gauges (`RadialArcGauge.tsx` & Razor Partials)**: Semicircular 180° gradient sweeps depicting Subnet Health Index (98.5% availability), WAN Throughput, Storage Allocation, and Endpoint Availability.
- **Dual Tachometer Speedometers (`SpeedometerGauge.tsx`)**: High-accuracy speedometer needles with numeric tick marks, sub-label readouts, and peak burst markers for Gigabit symmetrical lines.
- **Circular Ring Gauges (`RingGauge.tsx`)**: Circular stroke-dashoffset meters displaying processor utilization, memory consumption, and disk pool fill percentages.
- **Drive Thermal Dials (`DriveThermalGauge.tsx`)**: Real-time bay-by-bay temperature dials with color-coded thermal spectrums (Cool Green <38°C, Warm Amber 38–45°C, Warning Rose >45°C) and SMART integrity badges.
- **24-Hour Bandwidth Area Chart**: SVG path area visualization displaying rolling 24-hour upload/download throughput and latency graphs.

### 4. Network Intelligence Copilot Chat
- An integrated conversational diagnostics copilot powered by ASP.NET Core 9 `ChatController.cs` and local SignalR hubs.
- Natural-language querying for live telemetry:
  - *"What is the current network health and online count?"*
  - *"Show latest WAN speed test and throughput gauge"*
  - *"Are all NAS RAID storage pools healthy?"*
  - *"Check SSL certificate expiration on monitored websites"*
  - *"How do I handle the rogue MAC address alert?"*
  - *"Run active subnet discovery sweep"*
- **Dynamic Embedded Telemetry**: Copilot messages dynamically embed live mini-gauges and alert action cards directly within chat speech bubbles.

### 5. NAS & Storage Telemetry (Synology & TrueNAS)
- Real-time SNMP v2c / REST polling for network-attached storage nodes:
  - **Synology DS920+**: SHR-1 (Synology Hybrid RAID) array health, 4-bay thermal probes, volume allocation (14.8 / 24 TB).
  - **TrueNAS Scale**: ZFS RAID-Z2 pool integrity, ARC cache hit ratios, scrubbing status.
- Drive health tracking reporting SMART attributes, bad sector counts, and drive temperature gradients.

### 6. WAN Gigabit Bandwidth & Speed Daemon
- Autonomous background worker (`SpeedTestService.cs`) executing multi-stream download and upload benchmarks every 4 hours against regional Cloudflare and Ookla edge PoPs.
- Measures:
  - Download throughput (Mbps)
  - Upload throughput (Mbps)
  - Round-trip ping latency (ms)
  - Jitter variance (ms)
  - Bufferbloat egress grades

### 7. Resilient Multi-Channel Alert Engine
- Dispatches instantaneous notifications across three redundant alert channels:
  - **Discord Webhooks**: Embedded visual alert cards with color-coded severity strips (Critical Red, Warning Yellow, Info Blue) and node metadata.
  - **Telegram Bot API**: High-priority Markdown messages delivered to personal or group chat IDs.
  - **ntfy.sh**: Real-time push notifications to iOS/Android mobile devices with priority tags and actionable links.
- Automated incident detection:
  - New unwhitelisted MAC addresses detected on subnet (Rogue hardware warning).
  - Gateway or DNS server ICMP handshake timeouts.
  - SSL certificate expiration (< 7 days remaining).
  - NAS drive temperature exceeded safety threshold (> 48°C).

---

## System Requirements & Tools

| Component | Minimum Requirement | Recommended |
| :--- | :--- | :--- |
| **Operating System** | Linux (Ubuntu 22.04+, Debian 12, Alpine), Windows 10/11, macOS | Ubuntu Server 24.04 LTS or Alpine Linux (in Docker) |
| **.NET SDK** | .NET 9.0 SDK | .NET 9.0.100+ |
| **Container Engine** | Docker Engine 24.0+ & Docker Compose v2 | Docker Engine with `network_mode: host` |
| **Node.js (Preview)** | Node.js 18.x LTS | Node.js 20.x or 22.x |
| **Memory** | 512 MB RAM | 1 GB RAM |
| **Disk Space** | 250 MB | 500 MB (including local SQLite database) |
| **Network Privileges**| Raw socket capabilities (`NET_RAW`, `NET_ADMIN`) | Host networking mode |

---

## Quick Start Guide

### Option A: Docker Compose (Recommended)

Docker Compose provides the simplest, production-ready path for self-hosting on a home server, Raspberry Pi 4/5, or NAS.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/homepulse.git
   cd homepulse/dotnet
   ```

2. **Configure your credentials**:
   Edit `docker-compose.yml` (or create a `.env` file) to supply your Google OAuth credentials and allowed email:
   ```yaml
   environment:
     - Authentication__Google__ClientId=YOUR_CLIENT_ID.apps.googleusercontent.com
     - Authentication__Google__ClientSecret=YOUR_CLIENT_SECRET
     - Security__AllowedGoogleEmails__0=azhar.cs@gmail.com
     - Alerting__DiscordWebhookUrl=https://discord.com/api/webhooks/...
     - Alerting__NtfyTopic=homepulse-network-alerts
   ```

3. **Launch the container**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify container execution**:
   ```bash
   docker compose logs -f
   ```
   Navigate to `http://localhost:5000` (or `http://<server-ip>:5000`).

> **Note on Host Networking**:
> `network_mode: host` and `cap_add: [NET_ADMIN, NET_RAW]` are essential on Linux so that the container can read physical ARP tables and broadcast ICMP packets directly on your home subnet.

---

### Option B: Bare-Metal .NET 9 SDK

1. **Install the .NET 9 SDK**:
   Follow instructions at [dot.net/download](https://dotnet.microsoft.com/download/dotnet/9.0).

2. **Navigate to the .NET solution directory**:
   ```bash
   cd dotnet
   ```

3. **Restore NuGet packages**:
   ```bash
   dotnet restore HomePulse.csproj
   ```

4. **Configure `appsettings.json`**:
   Ensure `Security:AllowedGoogleEmails` contains your Google email and valid Google OAuth credentials are set.

5. **Run the ASP.NET Core application**:
   ```bash
   dotnet run
   ```
   The application will boot on `http://localhost:5000` (or `https://localhost:5001`).

---

### Option C: Vite / React Preview Mode

If you are developing or testing the responsive UI components in an interactive client preview:

1. **Install Node dependencies**:
   ```bash
   npm install
   ```

2. **Run Vite development server**:
   ```bash
   npm run dev
   ```
   Opens on port `3000` with hot-module reloading and mock network simulation.

3. **Validate TypeScript & Linting**:
   ```bash
   npm run lint
   npm run build
   ```

---

## Configuration Reference (`appsettings.json`)

The application is configured through `appsettings.json` or equivalent environment variables:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning",
      "HomePulse": "Debug"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=homepulse.db"
  },
  "Security": {
    "AllowedGoogleEmails": [
      "azhar.cs@gmail.com",
      "admin@homepulse.lan"
    ],
    "RequireHttpsMetadata": true
  },
  "Authentication": {
    "Google": {
      "ClientId": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
      "ClientSecret": "YOUR_GOOGLE_CLIENT_SECRET"
    }
  },
  "NetworkScanner": {
    "TargetSubnets": [
      "192.168.1.0/24"
    ],
    "PingTimeoutMs": 800,
    "ConcurrentPingLimit": 32,
    "ArpScanIntervalSeconds": 30,
    "PortScanTimeoutMs": 350,
    "DefaultPortsToProbe": [22, 80, 443, 445, 3000, 8080, 8123, 9000]
  },
  "Alerting": {
    "DiscordWebhookUrl": "",
    "TelegramBotToken": "",
    "TelegramChatId": "",
    "NtfyTopic": "homepulse-network-alerts",
    "SslWarningDaysThreshold": 7
  },
  "SpeedTest": {
    "IntervalHours": 4,
    "EnableAutomaticRuns": true
  }
}
```

### Environment Variable Overrides

For Docker or systemd service configurations, use the double underscore (`__`) delimiter:

| JSON Path | Environment Variable | Example |
| :--- | :--- | :--- |
| `Security:AllowedGoogleEmails:0` | `Security__AllowedGoogleEmails__0` | `azhar.cs@gmail.com` |
| `Authentication:Google:ClientId` | `Authentication__Google__ClientId` | `12345.apps.googleusercontent.com` |
| `Authentication:Google:ClientSecret` | `Authentication__Google__ClientSecret`| `GOCSPX-yourSecretKey` |
| `ConnectionStrings:DefaultConnection` | `ConnectionStrings__DefaultConnection` | `Data Source=/app/data/homepulse.db` |
| `Alerting:DiscordWebhookUrl` | `Alerting__DiscordWebhookUrl` | `https://discord.com/api/webhooks/...` |
| `Alerting:NtfyTopic` | `Alerting__NtfyTopic` | `homepulse-network-alerts` |
| `NetworkScanner:TargetSubnets:0` | `NetworkScanner__TargetSubnets__0` | `10.0.0.0/24` |

---

## Google OAuth 2.0 Setup Guide

To configure Google Authentication for your instance:

1. Visit the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Create a new project (e.g., `HomePulse Sentinel`).
3. Under **APIs & Services** > **OAuth consent screen**:
   - User Type: **External** (or Internal if using Google Workspace).
   - App Name: `HomePulse`.
   - User Support Email: your email.
   - Scopes: `openid`, `profile`, `email`.
   - Test Users: Add `azhar.cs@gmail.com`.
4. Under **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `HomePulse Web Client`.
   - **Authorized redirect URIs**:
     - Local development: `http://localhost:5000/signin-google` and `https://localhost:5001/signin-google`.
     - Self-hosted domain: `https://homepulse.yourdomain.com/signin-google`.
5. Copy the generated **Client ID** and **Client Secret** into your `appsettings.json` or Docker environment variables.

---

## SignalR Telemetry Hub Protocol

HomePulse broadcasts real-time telemetry over `/hubs/network`. Clients bind to the strongly-typed `IDashboardClient` contract:

```csharp
public interface IDashboardClient
{
    Task ReceiveDeviceDiscovered(NetworkDevice device);
    Task ReceiveDeviceUpdated(NetworkDevice device);
    Task ReceiveDeviceStatusChanged(string ipAddress, string macAddress, bool isOnline, double latencyMs);
    Task ReceivePingLatency(string ipAddress, double latencyMs);
    Task ReceiveServiceHealth(MonitoredService service);
    Task ReceiveAlert(SystemAlert alert);
    Task ReceiveSpeedTestResult(SpeedTestRecord record);
    Task ReceiveNasStorageUpdate(NasStorageNode node);
    Task ReceiveScanProgress(int scannedCount, int totalTargets, string statusMessage);
}
```

Clients subscribe using standard SignalR client libraries:
```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/network")
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .build();

connection.on("ReceivePingLatency", (ip, latencyMs) => {
    updateLatencyDial(ip, latencyMs);
});

await connection.start();
```

---

## Repository & Solution Structure

```
homepulse/
├── README.md                          # Master documentation & deployment reference
├── package.json                       # Node dependencies for frontend UI preview
├── vite.config.ts                     # Vite + Tailwind build configuration
├── metadata.json                      # Application metadata
│
├── dotnet/                            # ASP.NET Core 9 MVC Production Solution
│   ├── HomePulse.csproj               # .NET 9 Project file (EF Core, SignalR, Auth)
│   ├── Program.cs                     # Startup configuration, middleware, Google Auth & DI
│   ├── appsettings.json               # Application configuration template
│   ├── Dockerfile                     # Multi-stage Alpine container build
│   ├── docker-compose.yml             # Self-hosting Docker Compose template
│   │
│   ├── Controllers/                   # ASP.NET Core MVC Controllers
│   │   ├── HomeController.cs          # Executive Dashboard & KPI view
│   │   ├── DevicesController.cs       # Device discovery, port scanning & vendor edit
│   │   ├── StorageController.cs       # Synology DSM & TrueNAS SNMP telemetry
│   │   ├── ServicesController.cs      # Web endpoint & SSL certificate monitoring
│   │   ├── SpeedTestController.cs     # WAN bandwidth benchmarks
│   │   ├── AlertsController.cs        # Incident triage & webhook testing
│   │   └── ChatController.cs          # Network Intelligence Copilot API & view
│   │
│   ├── Hubs/                          # Real-Time Event Engine
│   │   └── DashboardHub.cs            # Strongly-typed SignalR Hub & client contracts
│   │
│   ├── Models/                        # EF Core Entities & ViewModels
│   │   ├── DashboardEntities.cs       # Database models (Device, Alert, SpeedTest, etc.)
│   │   ├── HomePulseDbContext.cs      # Entity Framework Core context
│   │   └── ViewModels/                # Strongly-typed Razor ViewModels
│   │
│   ├── Services/                      # Infrastructure & Network Scanning Daemons
│   │   ├── NetworkScannerService.cs   # ARP resolution & throttled ICMP sweeper
│   │   ├── ServiceMonitorWorker.cs    # HTTP / HTTPS & TLS certificate verifier
│   │   ├── SpeedTestService.cs        # Scheduled WAN benchmark daemon
│   │   ├── OUIVendorLookup.cs         # IEEE 24-bit MAC address vendor trie
│   │   └── AlertDispatcherService.cs  # Discord, Telegram, and ntfy.sh dispatchers
│   │
│   └── Views/                         # Razor MVC Views
│       ├── Shared/_Layout.cshtml      # Global master layout (nav, SignalR status, user)
│       ├── Home/Index.cshtml          # Dashboard with Radial Arc Gauges & Bandwidth Chart
│       ├── Devices/Index.cshtml       # Discovered inventory & port modal
│       ├── Storage/Index.cshtml       # NAS storage pools & drive temperature dials
│       ├── Services/Index.cshtml      # Monitored endpoints & SSL certificate cards
│       ├── SpeedTest/Index.cshtml     # Tachometer Speedometer gauges & speed history
│       ├── Alerts/Index.cshtml        # Alerting engine & webhook dispatch tester
│       └── Chat/Index.cshtml          # Network Intelligence Copilot Chat interface
│
└── src/                               # Frontend Component Suite
    ├── components/
    │   ├── Gauges.tsx                 # Inline SVG Gauges (Arc, Speedometer, Ring, Thermal)
    │   ├── NetworkCopilotChatView.tsx # Natural-language Copilot Chat with embedded gauges
    │   ├── OverviewDashboard.tsx      # Main overview dashboard with live telemetry
    │   ├── DeviceDiscoveryView.tsx    # Device explorer with subnet sweep triggers
    │   ├── StorageNasView.tsx         # Storage arrays with Ring & Thermal gauges
    │   ├── SpeedTestView.tsx          # WAN tachometer speedometers & 24h area chart
    │   ├── ServiceMonitorView.tsx     # Web endpoints & SSL health tracking
    │   ├── AlertsEngineView.tsx       # Alert triage & webhook dispatch actions
    │   ├── DotNetCodeExplorer.tsx     # Interactive in-browser C# Solution explorer
    │   └── Sidebar.tsx & Header.tsx   # Responsive navigation and status controls
    └── types.ts                       # Shared TypeScript models and interfaces
```

---

## Security & Hardening Checklist

When deploying HomePulse to an internet-accessible or production environment:

- [x] **Enforce HTTPS**: Terminate SSL via a reverse proxy (Caddy, Traefik, or Nginx) and forward headers (`X-Forwarded-For`, `X-Forwarded-Proto`).
- [x] **Lock Down Allowed Emails**: Verify that `Security:AllowedGoogleEmails` contains only your trusted Google account.
- [x] **Secure Cookies**: ASP.NET Core sets `HttpOnly` and `SameSite=Lax` cookies by default with antiforgery tokens.
- [x] **Isolate VLANs**: For dedicated scanning of an isolated IoT subnet, attach a secondary network interface to your Docker host and add the subnet to `NetworkScanner:TargetSubnets`.
- [x] **Limit Webhook Access**: Protect your Discord webhook URLs and Telegram bot tokens as confidential secrets.

---

## License

This project is licensed under the **MIT License**. You are free to modify, deploy, and self-host HomePulse within personal, commercial, or enterprise environments.
