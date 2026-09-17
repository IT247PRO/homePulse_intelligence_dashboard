import {
  NetworkDevice,
  MonitoredService,
  SystemAlert,
  SpeedTestRecord,
  ScanProgress
} from '../types';

export interface PortScanResult {
  port: number;
  service: string;
  state: 'Open' | 'Closed' | 'Filtered';
  banner?: string;
}

export const COMMON_PORT_DEFINITIONS: Record<number, string> = {
  21: 'FTP (File Transfer Protocol)',
  22: 'SSH (Secure Shell Daemon)',
  23: 'Telnet (Insecure Terminal)',
  53: 'DNS (Domain Name System / Pi-hole)',
  80: 'HTTP (Web Server)',
  110: 'POP3 (Mail Server)',
  143: 'IMAP (Mail Server)',
  443: 'HTTPS (SSL/TLS Encrypted Web)',
  445: 'SMB / CIFS (Samba File Sharing)',
  1400: 'Sonos Control Protocol',
  1443: 'Sonos HTTPS Streamer',
  1883: 'MQTT (Mosquitto IoT Broker)',
  3000: 'Grafana / Development Web Service',
  3389: 'RDP (Remote Desktop Protocol)',
  5000: 'Synology DSM Web Admin (HTTP)',
  5001: 'Synology DSM Web Admin (HTTPS)',
  7000: 'Apple AirPlay Control Protocol',
  8006: 'Proxmox Virtual Environment Web Console',
  8008: 'Google Cast / Dial Protocol',
  8080: 'HTTP Alternate Proxy',
  8123: 'Home Assistant Web Frontend',
  8443: 'UniFi Network Application Management',
  9000: 'Portainer / TrueNAS MinIO Storage Console',
  9443: 'Portainer HTTPS Console',
  32400: 'Plex Media Server Web Service'
};

export class NetworkSimulationEngine {
  public static simulatePortScan(ip: string, existingOpenPorts: number[]): Promise<PortScanResult[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const portsToTest = [21, 22, 53, 80, 443, 445, 1400, 1883, 3000, 5000, 5001, 7000, 8006, 8080, 8123, 8443, 9000, 32400];
        const results: PortScanResult[] = portsToTest.map(port => {
          const isOpen = existingOpenPorts.includes(port);
          return {
            port,
            service: COMMON_PORT_DEFINITIONS[port] || 'Unknown Service',
            state: isOpen ? 'Open' : 'Closed',
            banner: isOpen ? `Detected active service signature on ${ip}:${port}` : undefined
          };
        });
        resolve(results);
      }, 1200);
    });
  }

  public static simulateSubnetSweep(
    subnet: string,
    currentDevices: NetworkDevice[],
    onProgress: (scanned: number, total: number, message: string) => void
  ): Promise<NetworkDevice[]> {
    return new Promise((resolve) => {
      const totalTargets = 254;
      onProgress(15, totalTargets, `Scanning ${subnet}: ARP cache inspection (/proc/net/arp)...`);

      setTimeout(() => {
        onProgress(88, totalTargets, `Parallel ping sweep: SemaphoreSlim(32) active...`);
      }, 500);

      setTimeout(() => {
        onProgress(175, totalTargets, `mDNS multicast & reverse DNS query in progress...`);
      }, 1000);

      setTimeout(() => {
        onProgress(254, totalTargets, `Resolving IEEE OUI manufacturers & socket states...`);

        const updated = currentDevices.map((d) => {
          if (!d.isOnline) return d;
          const jitter = (Math.random() - 0.5) * 0.4;
          const newPing = Math.max(0.4, Math.round((d.pingLatencyMs + jitter) * 10) / 10);
          return {
            ...d,
            pingLatencyMs: newPing,
            lastSeenUtc: new Date().toISOString()
          };
        });

        resolve(updated);
      }, 1600);
    });
  }

  public static simulateScanCycle(
    onProgress: (progress: ScanProgress) => void,
    onComplete: (updatedDevices: NetworkDevice[], newAlert?: SystemAlert) => void,
    currentDevices: NetworkDevice[]
  ) {
    const totalTargets = 254;
    onProgress({
      isScanning: true,
      scannedCount: 15,
      totalTargets,
      statusMessage: 'ARP Table inspection: reading /proc/net/arp...'
    });

    setTimeout(() => {
      onProgress({
        isScanning: true,
        scannedCount: 95,
        totalTargets,
        statusMessage: 'Concurrent ping sweeper: SemaphoreSlim(32) active...'
      });
    }, 600);

    setTimeout(() => {
      onProgress({
        isScanning: true,
        scannedCount: 180,
        totalTargets,
        statusMessage: 'mDNS & SSDP multicast discovery query sent...'
      });
    }, 1300);

    setTimeout(() => {
      onProgress({
        isScanning: true,
        scannedCount: 254,
        totalTargets,
        statusMessage: 'Resolving IEEE OUI vendors & TCP port signatures...'
      });

      // Update latencies slightly
      const updated = currentDevices.map(d => {
        if (!d.isOnline) return d;
        const jitter = (Math.random() - 0.5) * 0.4;
        const newPing = Math.max(0.4, Math.round((d.pingLatencyMs + jitter) * 10) / 10);
        return {
          ...d,
          pingLatencyMs: newPing,
          lastSeenUtc: new Date().toISOString()
        };
      });

      onComplete(updated);
    }, 2000);
  }

  public static simulateSpeedTest(
    onStep: (step: string, percent: number) => void
  ): Promise<SpeedTestRecord> {
    return new Promise((resolve) => {
      onStep('Connecting to closest CDN edge server (Chicago PoP)...', 15);
      setTimeout(() => {
        onStep('Testing round-trip ICMP & TCP handshakes...', 35);
      }, 700);

      setTimeout(() => {
        onStep('Burst testing multi-stream Download throughput...', 65);
      }, 1500);

      setTimeout(() => {
        onStep('Benchmarking reverse Upload stream...', 85);
      }, 2400);

      setTimeout(() => {
        onStep('Finalizing metrics and compiling jitter statistics...', 100);
        const download = Math.round((930 + Math.random() * 35) * 10) / 10;
        const upload = Math.round((460 + Math.random() * 30) * 10) / 10;
        const ping = Math.round((7.2 + Math.random() * 2) * 10) / 10;
        const jitter = Math.round((0.8 + Math.random() * 0.8) * 10) / 10;

        const record: SpeedTestRecord = {
          id: 'st-' + Date.now(),
          timestampUtc: new Date().toISOString(),
          downloadMbps: download,
          uploadMbps: upload,
          pingLatencyMs: ping,
          jitterMs: jitter,
          serverLocation: 'Fastly / Cloudflare Edge (Chicago Datacenter)',
          clientIp: '73.168.45.12'
        };
        resolve(record);
      }, 3100);
    });
  }
}
