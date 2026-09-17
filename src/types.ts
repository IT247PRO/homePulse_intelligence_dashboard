export type DeviceCategory = 'Infrastructure' | 'Storage' | 'Mobile' | 'IoT' | 'Workstation';

export type AlertSeverity = 'Info' | 'Warning' | 'Critical';

export type NavigationTab = 
  | 'overview' 
  | 'devices' 
  | 'storage' 
  | 'services' 
  | 'chat'
  | 'speedtest' 
  | 'alerts' 
  | 'google' 
  | 'architecture';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  embeddedData?: {
    type: 'healthGauge' | 'speedGauge' | 'storageGauge' | 'deviceCard' | 'alertCard';
    data?: any;
  };
}

export interface NetworkDevice {
  id: string;
  macAddress: string;
  ipAddress: string;
  hostname: string;
  customAlias: string;
  category: DeviceCategory;
  vendor: string;
  isOnline: boolean;
  pingLatencyMs: number;
  openPorts: number[];
  isWhitelisted: boolean;
  isAlertMuted: boolean;
  notes?: string;
  firstDiscoveredUtc: string;
  lastSeenUtc: string;
}

export interface MonitoredService {
  id: string;
  name: string;
  targetUrl: string;
  expectedStatusCode: number;
  checkIntervalSeconds: number;
  isOnline: boolean;
  lastStatusCode: number;
  responseLatencyMs: number;
  sslCertExpiryUtc?: string;
  sslDaysRemaining?: number;
  isEnabled: boolean;
  lastCheckedUtc: string;
}

export interface DriveTempInfo {
  drive: string;
  tempC: number;
  status: 'Normal' | 'Warning' | 'Critical';
}

export interface NasStorageNode {
  id: string;
  name: string;
  hostIp: string;
  nasType: string;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  raidStatus: string;
  driveTemperatures: DriveTempInfo[];
  lastUpdatedUtc: string;
}

export interface SystemAlert {
  id: string;
  timestampUtc: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  isResolved: boolean;
  dispatchedWebhooks: string[];
}

export interface SpeedTestRecord {
  id: string;
  timestampUtc: string;
  downloadMbps: number;
  uploadMbps: number;
  pingLatencyMs: number;
  jitterMs: number;
  serverLocation: string;
  clientIp?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location?: string;
  htmlLink?: string;
  conferenceLink?: string;
}

export interface GoogleMailHighlight {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  receivedUtc: string;
  isUrgent: boolean;
}

export interface UserSession {
  isAuthenticated: boolean;
  email: string;
  name: string;
  picture: string;
  isWhitelisted: boolean;
}

export interface ScanProgress {
  isScanning: boolean;
  scannedCount: number;
  totalTargets: number;
  statusMessage: string;
}
