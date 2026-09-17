import {
  NetworkDevice,
  MonitoredService,
  NasStorageNode,
  SystemAlert,
  SpeedTestRecord,
  GoogleCalendarEvent,
  GoogleMailHighlight,
  UserSession
} from './types';

export const initialUserSession: UserSession = {
  isAuthenticated: true,
  email: 'azhar.cs@gmail.com',
  name: 'Azhar Principal Architect',
  picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isWhitelisted: true
};

export const initialDevices: NetworkDevice[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    macAddress: '24:5A:4C:11:22:33',
    ipAddress: '192.168.1.1',
    hostname: 'udm-pro.lan',
    customAlias: 'Ubiquiti Dream Machine Pro SE',
    category: 'Infrastructure',
    vendor: 'Ubiquiti Inc.',
    isOnline: true,
    pingLatencyMs: 0.8,
    openPorts: [22, 53, 80, 443, 8443],
    isWhitelisted: true,
    isAlertMuted: false,
    notes: 'Core Gateway & 10G SFP+ Uplink to WAN',
    firstDiscoveredUtc: '2026-09-01T08:00:00Z',
    lastSeenUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    macAddress: '00:11:32:AA:BB:CC',
    ipAddress: '192.168.1.10',
    hostname: 'synology-ds920.lan',
    customAlias: 'Main Vault NAS (Synology DS920+)',
    category: 'Storage',
    vendor: 'Synology Incorporated',
    isOnline: true,
    pingLatencyMs: 1.2,
    openPorts: [22, 80, 443, 445, 5000, 5001],
    isWhitelisted: true,
    isAlertMuted: false,
    notes: '4x Seagate IronWolf 8TB in SHR-1. Docker host for vaultwarden & immich.',
    firstDiscoveredUtc: '2026-09-01T08:00:00Z',
    lastSeenUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    macAddress: 'B8:27:EB:D1:E2:F3',
    ipAddress: '192.168.1.15',
    hostname: 'homeassistant.lan',
    customAlias: 'Home Assistant Supervised (RPi 5)',
    category: 'IoT',
    vendor: 'Raspberry Pi Foundation',
    isOnline: true,
    pingLatencyMs: 2.1,
    openPorts: [22, 8123, 1883],
    isWhitelisted: true,
    isAlertMuted: false,
    notes: 'Zigbee & Z-Wave USB Dongles attached. MQTT broker broker on 1883.',
    firstDiscoveredUtc: '2026-09-01T08:00:00Z',
    lastSeenUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    macAddress: '00:15:00:88:99:AA',
    ipAddress: '192.168.1.25',
    hostname: 'truenas-core.lan',
    customAlias: 'Secondary Backup Pool (TrueNAS Scale)',
    category: 'Storage',
    vendor: 'Intel Corporate',
    isOnline: true,
    pingLatencyMs: 1.0,
    openPorts: [22, 80, 443, 445, 9000],
    isWhitelisted: true,
    isAlertMuted: false,
    notes: 'ZFS Mirrored 16TB Array for offsite snapshots and Time Machine targets.',
    firstDiscoveredUtc: '2026-09-05T10:15:00Z',
    lastSeenUtc: '2026-09-17T12:43:00Z'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    macAddress: '14:98:77:45:67:89',
    ipAddress: '192.168.1.45',
    hostname: 'appletv-livingroom.lan',
    customAlias: 'Living Room Apple TV 4K',
    category: 'IoT',
    vendor: 'Apple Inc.',
    isOnline: true,
    pingLatencyMs: 4.2,
    openPorts: [7000, 8008, 49152],
    isWhitelisted: true,
    isAlertMuted: true,
    notes: 'HomeKit Hub & AirPlay 2 Receiver',
    firstDiscoveredUtc: '2026-09-02T14:20:00Z',
    lastSeenUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    macAddress: '00:17:88:6C:54:12',
    ipAddress: '192.168.1.52',
    hostname: 'philips-hue-bridge.lan',
    customAlias: 'Hue Lighting Bridge v2',
    category: 'IoT',
    vendor: 'Signify Netherlands B.V. (Philips Hue)',
    isOnline: true,
    pingLatencyMs: 3.5,
    openPorts: [80, 443],
    isWhitelisted: true,
    isAlertMuted: false,
    notes: 'Controlling 38 smart bulbs & motion sensors across floors',
    firstDiscoveredUtc: '2026-09-01T08:00:00Z',
    lastSeenUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    macAddress: '3C:15:C2:DE:FA:01',
    ipAddress: '192.168.1.88',
    hostname: 'azhar-mbp.lan',
    customAlias: 'Architect Workstation (MacBook Pro M3 Max)',
    category: 'Workstation',
    vendor: 'Apple Inc.',
    isOnline: true,
    pingLatencyMs: 5.1,
    openPorts: [22, 3000, 5000],
    isWhitelisted: true,
    isAlertMuted: false,
    notes: 'Developer Workstation connected over Wi-Fi 7 (6 GHz Band)',
    firstDiscoveredUtc: '2026-09-01T08:00:00Z',
    lastSeenUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    macAddress: 'F0:18:98:33:44:55',
    ipAddress: '192.168.1.92',
    hostname: 'iphone-16-pro.lan',
    customAlias: 'Azhar iPhone 16 Pro',
    category: 'Mobile',
    vendor: 'Apple Inc.',
    isOnline: true,
    pingLatencyMs: 8.3,
    openPorts: [],
    isWhitelisted: true,
    isAlertMuted: true,
    notes: 'Personal device with Private Wi-Fi address disabled for LAN discovery',
    firstDiscoveredUtc: '2026-09-03T19:00:00Z',
    lastSeenUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    macAddress: 'DC:26:32:91:02:11',
    ipAddress: '192.168.1.105',
    hostname: 'pihole-primary.lan',
    customAlias: 'Pi-hole DNS Primary Sinkhole',
    category: 'Infrastructure',
    vendor: 'Raspberry Pi Trading Ltd',
    isOnline: true,
    pingLatencyMs: 1.5,
    openPorts: [53, 80],
    isWhitelisted: true,
    isAlertMuted: false,
    notes: 'Handling recursive DNS caching via Unbound. 24.8% ad-block rate.',
    firstDiscoveredUtc: '2026-09-01T08:00:00Z',
    lastSeenUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    macAddress: '58:A2:B5:11:78:90',
    ipAddress: '192.168.1.118',
    hostname: 'lgwebostv.lan',
    customAlias: 'Home Cinema (LG C3 OLED 77")',
    category: 'IoT',
    vendor: 'LG Electronics',
    isOnline: false,
    pingLatencyMs: 0,
    openPorts: [8080],
    isWhitelisted: true,
    isAlertMuted: true,
    notes: 'Standby mode (QuickStart+ enabled)',
    firstDiscoveredUtc: '2026-09-04T12:00:00Z',
    lastSeenUtc: '2026-09-17T11:30:00Z'
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    macAddress: '5C:31:3E:AA:12:34',
    ipAddress: '192.168.1.140',
    hostname: 'sonos-arc.lan',
    customAlias: 'Living Room Sonos Arc & Sub',
    category: 'IoT',
    vendor: 'Sonos Inc.',
    isOnline: true,
    pingLatencyMs: 4.8,
    openPorts: [1400, 1443],
    isWhitelisted: true,
    isAlertMuted: true,
    notes: 'SonosNet wireless mesh anchor',
    firstDiscoveredUtc: '2026-09-02T10:00:00Z',
    lastSeenUtc: '2026-09-17T12:44:00Z'
  }
];

export const initialNasNodes: NasStorageNode[] = [
  {
    id: 'nas-1',
    name: 'Synology DiskStation DS920+',
    hostIp: '192.168.1.10',
    nasType: 'Synology DSM 7.2.2',
    cpuUsagePercent: 24.5,
    ramUsagePercent: 48.2,
    diskUsedBytes: 14_800_000_000_000, // 14.8 TB
    diskTotalBytes: 24_000_000_000_000, // 24 TB
    raidStatus: 'Healthy (Synology Hybrid RAID - SHR-1)',
    driveTemperatures: [
      { drive: 'Bay 1: Seagate IronWolf 8TB', tempC: 36, status: 'Normal' },
      { drive: 'Bay 2: Seagate IronWolf 8TB', tempC: 37, status: 'Normal' },
      { drive: 'Bay 3: Seagate IronWolf 8TB', tempC: 35, status: 'Normal' },
      { drive: 'Bay 4: Seagate IronWolf 8TB', tempC: 38, status: 'Normal' }
    ],
    lastUpdatedUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: 'nas-2',
    name: 'Secondary Vault (TrueNAS Scale)',
    hostIp: '192.168.1.25',
    nasType: 'TrueNAS SCALE 24.04',
    cpuUsagePercent: 12.0,
    ramUsagePercent: 64.8,
    diskUsedBytes: 6_200_000_000_000, // 6.2 TB
    diskTotalBytes: 16_000_000_000_000, // 16 TB
    raidStatus: 'Healthy (ZFS Mirror - Pool: data_vault)',
    driveTemperatures: [
      { drive: 'Drive A: WD Red Plus 8TB', tempC: 33, status: 'Normal' },
      { drive: 'Drive B: WD Red Plus 8TB', tempC: 34, status: 'Normal' }
    ],
    lastUpdatedUtc: '2026-09-17T12:44:00Z'
  }
];

export const initialServices: MonitoredService[] = [
  {
    id: 'srv-1',
    name: 'Proxmox VE Cluster',
    targetUrl: 'https://pve.lan:8006',
    expectedStatusCode: 200,
    checkIntervalSeconds: 30,
    isOnline: true,
    lastStatusCode: 200,
    responseLatencyMs: 14.2,
    sslCertExpiryUtc: '2027-02-14T00:00:00Z',
    sslDaysRemaining: 150,
    isEnabled: true,
    lastCheckedUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: 'srv-2',
    name: 'Home Assistant Cloud (Nabu Casa)',
    targetUrl: 'https://ha.homepulse.lan',
    expectedStatusCode: 200,
    checkIntervalSeconds: 60,
    isOnline: true,
    lastStatusCode: 200,
    responseLatencyMs: 22.8,
    sslCertExpiryUtc: '2026-09-22T10:00:00Z',
    sslDaysRemaining: 5, // CRITICAL: < 7 days alert threshold!
    isEnabled: true,
    lastCheckedUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: 'srv-3',
    name: 'Grafana Metrics & Telemetry',
    targetUrl: 'https://grafana.lan:3000',
    expectedStatusCode: 200,
    checkIntervalSeconds: 60,
    isOnline: true,
    lastStatusCode: 200,
    responseLatencyMs: 9.5,
    sslCertExpiryUtc: '2026-12-18T00:00:00Z',
    sslDaysRemaining: 92,
    isEnabled: true,
    lastCheckedUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: 'srv-4',
    name: 'Plex Media Server',
    targetUrl: 'https://plex.lan:32400/web',
    expectedStatusCode: 200,
    checkIntervalSeconds: 60,
    isOnline: true,
    lastStatusCode: 200,
    responseLatencyMs: 18.1,
    sslCertExpiryUtc: '2027-04-10T00:00:00Z',
    sslDaysRemaining: 205,
    isEnabled: true,
    lastCheckedUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: 'srv-5',
    name: 'Pi-hole DNS Sinkhole Web UI',
    targetUrl: 'http://192.168.1.105/admin',
    expectedStatusCode: 200,
    checkIntervalSeconds: 60,
    isOnline: true,
    lastStatusCode: 200,
    responseLatencyMs: 5.4,
    isEnabled: true,
    lastCheckedUtc: '2026-09-17T12:44:00Z'
  },
  {
    id: 'srv-6',
    name: 'Nextcloud Hub Storage',
    targetUrl: 'https://cloud.homepulse.lan',
    expectedStatusCode: 200,
    checkIntervalSeconds: 60,
    isOnline: true,
    lastStatusCode: 200,
    responseLatencyMs: 31.4,
    sslCertExpiryUtc: '2026-10-15T00:00:00Z',
    sslDaysRemaining: 28,
    isEnabled: true,
    lastCheckedUtc: '2026-09-17T12:44:00Z'
  }
];

export const initialAlerts: SystemAlert[] = [
  {
    id: 'alt-1',
    timestampUtc: '2026-09-17T12:35:00Z',
    severity: 'Warning',
    title: 'SSL Certificate Expiring (< 7 Days)',
    message: 'Certificate for https://ha.homepulse.lan expires in 5 days (2026-09-22). Let\'s Encrypt ACME renewal recommended.',
    source: 'SslSentinel',
    isResolved: false,
    dispatchedWebhooks: ['SignalR_UI', 'Discord', 'ntfy.sh']
  },
  {
    id: 'alt-2',
    timestampUtc: '2026-09-17T11:42:00Z',
    severity: 'Info',
    title: 'New Host Discovered on Subnet',
    message: 'Discovered iPhone 16 Pro (192.168.1.92, MAC: F0:18:98:33:44:55, Vendor: Apple Inc.) on 192.168.1.0/24.',
    source: 'ArpDiscoveryEngine',
    isResolved: true,
    dispatchedWebhooks: ['SignalR_UI', 'ntfy.sh']
  },
  {
    id: 'alt-3',
    timestampUtc: '2026-09-17T09:10:00Z',
    severity: 'Info',
    title: 'Automated ZFS Pool Scrub Succeeded',
    message: 'TrueNAS Secondary Vault completed scheduled bimonthly scrub: 0 errors detected across 6.2 TB.',
    source: 'NasAgent',
    isResolved: true,
    dispatchedWebhooks: ['SignalR_UI', 'Discord']
  }
];

export const initialSpeedTestHistory: SpeedTestRecord[] = [
  {
    id: 'st-1',
    timestampUtc: '2026-09-17T12:00:00Z',
    downloadMbps: 942.5,
    uploadMbps: 480.2,
    pingLatencyMs: 7.8,
    jitterMs: 1.1,
    serverLocation: 'Cloudflare Edge (Chicago Datacenter)',
    clientIp: '73.168.45.12'
  },
  {
    id: 'st-2',
    timestampUtc: '2026-09-17T08:00:00Z',
    downloadMbps: 938.1,
    uploadMbps: 476.5,
    pingLatencyMs: 8.2,
    jitterMs: 1.4,
    serverLocation: 'Cloudflare Edge (Chicago Datacenter)',
    clientIp: '73.168.45.12'
  },
  {
    id: 'st-3',
    timestampUtc: '2026-09-17T04:00:00Z',
    downloadMbps: 955.0,
    uploadMbps: 485.1,
    pingLatencyMs: 7.2,
    jitterMs: 0.9,
    serverLocation: 'Cloudflare Edge (Chicago Datacenter)',
    clientIp: '73.168.45.12'
  },
  {
    id: 'st-4',
    timestampUtc: '2026-09-17T00:00:00Z',
    downloadMbps: 920.4,
    uploadMbps: 470.0,
    pingLatencyMs: 8.9,
    jitterMs: 1.6,
    serverLocation: 'Cloudflare Edge (Chicago Datacenter)',
    clientIp: '73.168.45.12'
  },
  {
    id: 'st-5',
    timestampUtc: '2026-09-16T20:00:00Z',
    downloadMbps: 894.2,
    uploadMbps: 462.8,
    pingLatencyMs: 9.4,
    jitterMs: 2.1,
    serverLocation: 'Cloudflare Edge (Chicago Datacenter)',
    clientIp: '73.168.45.12'
  }
];

export const initialCalendarEvents: GoogleCalendarEvent[] = [
  {
    id: 'cal-1',
    summary: 'Enterprise Cloud & Network Architecture Review',
    startTime: '2026-09-17T13:30:00Z',
    endTime: '2026-09-17T14:30:00Z',
    isAllDay: false,
    location: 'Google Meet',
    conferenceLink: 'https://meet.google.com/abc-defg-hij'
  },
  {
    id: 'cal-2',
    summary: 'Synology & ZFS Disaster Recovery Drill',
    startTime: '2026-09-17T16:00:00Z',
    endTime: '2026-09-17T17:00:00Z',
    isAllDay: false,
    location: 'Home Lab Rack Room'
  },
  {
    id: 'cal-3',
    summary: 'Home Assistant 2026.9 Core Update Release',
    startTime: '2026-09-17T18:30:00Z',
    endTime: '2026-09-17T19:00:00Z',
    isAllDay: false,
    location: 'YouTube Live Premiere',
    htmlLink: 'https://calendar.google.com'
  }
];

export const initialGmailHighlights: GoogleMailHighlight[] = [
  {
    id: 'mail-1',
    from: 'Ubiquiti UniFi Support <notifications@ui.com>',
    subject: 'UniFi Network Application 8.6.9 Official Release Available',
    snippet: 'UniFi Network Application 8.6.9 includes critical fixes for WireGuard site-to-site VPN routing, multi-gigabit flow control improvements...',
    receivedUtc: '2026-09-17T11:20:00Z',
    isUrgent: true
  },
  {
    id: 'mail-2',
    from: 'Synology Security Advisory <security@synology.com>',
    subject: 'Monthly Security Advisory: DSM 7.2.2 Critical Patch',
    snippet: 'Synology has published security updates addressing OpenSSL and Samba vulnerabilities in DSM. Your DS920+ auto-update schedule is queued...',
    receivedUtc: '2026-09-17T09:45:00Z',
    isUrgent: false
  },
  {
    id: 'mail-3',
    from: 'Cloudflare Zero Trust <noreply@cloudflare.com>',
    subject: 'Cloudflare Tunnel "homepulse-primary" Healthy & Connected',
    snippet: 'All 4 connector edge connections are operating with sub-10ms roundtrip latency across ORD and DTW PoPs...',
    receivedUtc: '2026-09-17T07:15:00Z',
    isUrgent: false
  }
];
