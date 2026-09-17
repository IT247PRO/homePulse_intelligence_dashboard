import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { DeviceDiscoveryView } from './components/DeviceDiscoveryView';
import { StorageNasView } from './components/StorageNasView';
import { ServiceMonitorView } from './components/ServiceMonitorView';
import { GoogleWorkspaceView } from './components/GoogleWorkspaceView';
import { SpeedTestView } from './components/SpeedTestView';
import { AlertsEngineView } from './components/AlertsEngineView';
import { NetworkCopilotChatView } from './components/NetworkCopilotChatView';
import { DotNetCodeExplorer } from './components/DotNetCodeExplorer';
import { EditDeviceModal } from './components/EditDeviceModal';
import { PortScanModal } from './components/PortScanModal';
import {
  NavigationTab,
  NetworkDevice,
  MonitoredService,
  NasStorageNode,
  SystemAlert,
  SpeedTestRecord,
  ScanProgress
} from './types';
import {
  initialDevices,
  initialServices,
  initialNasNodes,
  initialAlerts,
  initialSpeedTestHistory,
  initialCalendarEvents,
  initialGmailHighlights,
  initialUserSession
} from './mockData';
import { NetworkSimulationEngine } from './services/networkSimulation';

export default function App() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isSignalRConnected, setIsSignalRConnected] = useState<boolean>(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubnet, setSelectedSubnet] = useState('192.168.1.0/24');

  // Core Data Collections
  const [devices, setDevices] = useState<NetworkDevice[]>(initialDevices);
  const [services, setServices] = useState<MonitoredService[]>(initialServices);
  const [nasNodes, setNasNodes] = useState<NasStorageNode[]>(initialNasNodes);
  const [alerts, setAlerts] = useState<SystemAlert[]>(initialAlerts);
  const [speedTestHistory, setSpeedTestHistory] = useState<SpeedTestRecord[]>(initialSpeedTestHistory);
  const [calendarEvents] = useState(initialCalendarEvents);
  const [mailHighlights] = useState(initialGmailHighlights);

  // Modals & Active Device
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [portScanningDevice, setPortScanningDevice] = useState<NetworkDevice | null>(null);

  // Subnet Scanning State
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    isScanning: false,
    scannedCount: 0,
    totalTargets: 254,
    statusMessage: 'Idle'
  });

  // Dark Mode Sync with DOM
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Live SignalR Ping Stream Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSignalRConnected) return;

      // Select 1 or 2 random devices and fluctuate their latency slightly
      setDevices((prev) =>
        prev.map((d) => {
          if (!d.isOnline) return d;
          if (Math.random() > 0.6) {
            const jitter = (Math.random() - 0.5) * 1.5;
            const newLatency = Math.max(0.4, Number((d.pingLatencyMs + jitter).toFixed(1)));
            return { ...d, pingLatencyMs: newLatency, lastSeenUtc: new Date().toISOString() };
          }
          return d;
        })
      );
    }, 3500);

    return () => clearInterval(timer);
  }, [isSignalRConnected]);

  // Trigger Subnet Scan
  const handleTriggerScan = async () => {
    if (scanProgress.isScanning) return;

    setScanProgress({
      isScanning: true,
      scannedCount: 0,
      totalTargets: 254,
      statusMessage: `Broadcasting ARP & ICMP probes across ${selectedSubnet}...`
    });

    const discovered = await NetworkSimulationEngine.simulateSubnetSweep(
      selectedSubnet,
      devices,
      (scanned: number, total: number, msg: string) => {
        setScanProgress({
          isScanning: true,
          scannedCount: scanned,
          totalTargets: total,
          statusMessage: msg
        });
      }
    );

    setDevices(discovered);
    setScanProgress({
      isScanning: false,
      scannedCount: 254,
      totalTargets: 254,
      statusMessage: 'Subnet sweep completed.'
    });
  };

  // Device Update Handlers
  const handleSaveDevice = (updated: NetworkDevice) => {
    setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleUpdateOpenPorts = (deviceId: string, openPorts: number[]) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, openPorts } : d))
    );
  };

  // Service Handlers
  const handleAddService = (srv: MonitoredService) => {
    setServices((prev) => [srv, ...prev]);
  };

  const handleDeleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // Speed Test Handlers
  const handleAddSpeedTestRecord = (record: SpeedTestRecord) => {
    setSpeedTestHistory((prev) => [record, ...prev]);
  };

  // Alert Handlers
  const handleToggleResolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isResolved: !a.isResolved } : a))
    );
  };

  const handleTriggerTestAlert = () => {
    const testAlert: SystemAlert = {
      id: 'alert-' + Date.now(),
      title: 'Manual Test Trigger: Unrecognized Wi-Fi Client Association',
      message: 'New MAC DC:A6:32:99:FF:01 associated with SSID "IoT_Isolated". Automatic packet inspection started.',
      severity: 'Warning',
      source: 'Wi-Fi Sentinel',
      timestampUtc: new Date().toISOString(),
      isResolved: false,
      dispatchedWebhooks: ['SignalR_UI', 'Discord', 'ntfy.sh']
    };
    setAlerts((prev) => [testAlert, ...prev]);
  };

  // Filtered devices according to top search
  const searchedDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    const q = searchQuery.toLowerCase();
    return devices.filter(
      (d) =>
        d.customAlias.toLowerCase().includes(q) ||
        d.ipAddress.includes(q) ||
        d.macAddress.toLowerCase().includes(q) ||
        d.vendor.toLowerCase().includes(q)
    );
  }, [devices, searchQuery]);

  // Telemetry metrics
  const onlineCount = devices.filter((d) => d.isOnline).length;
  const warningCount = alerts.filter((a) => !a.isResolved).length;
  const averageLatencyMs = useMemo(() => {
    const active = devices.filter((d) => d.isOnline && d.pingLatencyMs > 0);
    if (!active.length) return 0;
    const sum = active.reduce((acc, curr) => acc + curr.pingLatencyMs, 0);
    return Number((sum / active.length).toFixed(1));
  }, [devices]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Primary Navigation Sidebar */}
      <Sidebar
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onlineDeviceCount={onlineCount}
        totalDeviceCount={devices.length}
        alertCount={warningCount}
        isDarkMode={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        isSignalRConnected={isSignalRConnected}
      />

      {/* Main App Stage */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSubnet={selectedSubnet}
          onSelectSubnet={setSelectedSubnet}
          scanProgress={scanProgress}
          onTriggerScan={handleTriggerScan}
          onlineCount={onlineCount}
          totalCount={devices.length}
          averageLatencyMs={averageLatencyMs}
          warningCount={warningCount}
        />

        {/* Scan Progress Banner */}
        {scanProgress.isScanning && (
          <div className="bg-indigo-600 text-white px-6 py-2.5 flex items-center justify-between text-xs shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="font-semibold">{scanProgress.statusMessage}</span>
            </div>
            <div className="font-mono text-indigo-100 font-medium">
              Scanning target {scanProgress.scannedCount} of {scanProgress.totalTargets}
            </div>
          </div>
        )}

        {/* Dynamic View Scroll Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewDashboard
                devices={searchedDevices}
                services={services}
                nasNodes={nasNodes}
                alerts={alerts}
                latestSpeedTest={speedTestHistory[0]}
                calendarEvents={calendarEvents}
                mailHighlights={mailHighlights}
                onNavigate={setActiveTab}
                onSelectDeviceForPortScan={(d) => setPortScanningDevice(d)}
              />
            )}

            {activeTab === 'devices' && (
              <DeviceDiscoveryView
                devices={searchedDevices}
                onEditDevice={(d) => setEditingDevice(d)}
                onPortScan={(d) => setPortScanningDevice(d)}
                onTriggerScan={handleTriggerScan}
                isScanning={scanProgress.isScanning}
              />
            )}

            {activeTab === 'storage' && <StorageNasView nasNodes={nasNodes} />}

            {activeTab === 'services' && (
              <ServiceMonitorView
                services={services}
                onAddService={handleAddService}
                onDeleteService={handleDeleteService}
              />
            )}

            {activeTab === 'chat' && (
              <NetworkCopilotChatView
                devices={devices}
                services={services}
                nasNodes={nasNodes}
                alerts={alerts}
                speedTest={speedTestHistory[0] || null}
                onTriggerScan={handleTriggerScan}
                onTriggerSpeedTest={() => {
                  setActiveTab('speedtest');
                }}
              />
            )}

            {activeTab === 'google' && (
              <GoogleWorkspaceView
                userSession={initialUserSession}
                calendarEvents={calendarEvents}
                mailHighlights={mailHighlights}
              />
            )}

            {activeTab === 'speedtest' && (
              <SpeedTestView
                history={speedTestHistory}
                onAddRecord={handleAddSpeedTestRecord}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsEngineView
                alerts={alerts}
                onTriggerTestAlert={handleTriggerTestAlert}
                onToggleResolve={handleToggleResolveAlert}
              />
            )}

            {activeTab === 'architecture' && <DotNetCodeExplorer />}
          </div>
        </main>
      </div>

      {/* Edit Device Modal */}
      {editingDevice && (
        <EditDeviceModal
          device={editingDevice}
          onClose={() => setEditingDevice(null)}
          onSave={handleSaveDevice}
        />
      )}

      {/* Port Scanner Modal */}
      {portScanningDevice && (
        <PortScanModal
          device={portScanningDevice}
          onClose={() => setPortScanningDevice(null)}
          onUpdateOpenPorts={handleUpdateOpenPorts}
        />
      )}
    </div>
  );
}
