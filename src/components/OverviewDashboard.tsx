import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  HardDrive,
  Calendar,
  Mail,
  Activity,
  Gauge,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Lock,
  Bot,
  Sparkles,
  MessagesSquare
} from 'lucide-react';
import {
  NetworkDevice,
  MonitoredService,
  NasStorageNode,
  SystemAlert,
  SpeedTestRecord,
  GoogleCalendarEvent,
  GoogleMailHighlight,
  NavigationTab
} from '../types';
import { RadialArcGauge, RingGauge } from './Gauges';

interface OverviewDashboardProps {
  devices: NetworkDevice[];
  services: MonitoredService[];
  nasNodes: NasStorageNode[];
  alerts: SystemAlert[];
  latestSpeedTest?: SpeedTestRecord;
  calendarEvents: GoogleCalendarEvent[];
  mailHighlights: GoogleMailHighlight[];
  onNavigate: (tab: NavigationTab) => void;
  onSelectDeviceForPortScan: (device: NetworkDevice) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  devices,
  services,
  nasNodes,
  alerts,
  latestSpeedTest,
  calendarEvents,
  mailHighlights,
  onNavigate,
  onSelectDeviceForPortScan
}) => {
  const onlineDevices = devices.filter((d) => d.isOnline);
  const activeAlerts = alerts.filter((a) => !a.isResolved);
  const primaryNas = nasNodes[0];

  const categoryCounts = devices.reduce(
    (acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Alert if active warnings exist */}
      {activeAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {activeAlerts[0].title}
              </div>
              <div className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                {activeAlerts[0].message}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shrink-0"
          >
            Review Alerts ({activeAlerts.length})
          </button>
        </div>
      )}

      {/* Primary Telemetry Gauges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gauge 1: Network Health Arc Gauge */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Subnet Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <RadialArcGauge
            value={98.5}
            label="Fleet Availability"
            sublabel="Optimal"
            colorGradient="emerald"
            size="md"
          />
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2">
            {onlineDevices.length} / {devices.length} nodes responding
          </div>
        </div>

        {/* Gauge 2: WAN Gigabit Download Speed Gauge */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">WAN Gigabit Down</span>
            <Gauge className="w-4 h-4 text-indigo-500" />
          </div>
          <RadialArcGauge
            value={Math.round((latestSpeedTest?.downloadMbps || 942.5) / 10)}
            unit="%"
            label={`${latestSpeedTest?.downloadMbps || 942.5} Mbps Down`}
            sublabel="94% Line Cap"
            colorGradient="indigo"
            size="md"
          />
          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2">
            Ping: {latestSpeedTest?.pingLatencyMs || 7.8}ms RTT
          </div>
        </div>

        {/* Gauge 3: Main NAS Storage Capacity Gauge */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Storage Pool (SHR-1)</span>
            <HardDrive className="w-4 h-4 text-cyan-500" />
          </div>
          <RadialArcGauge
            value={61.6}
            unit="%"
            label="14.8 / 24 TB Used"
            sublabel="Array Healthy"
            colorGradient="cyan"
            size="md"
          />
          <div className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 mt-2">
            4 Drives Nominal (32°C)
          </div>
        </div>

        {/* Gauge 4: Monitored Services & SSL Gauge */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">HTTP / SSL Sentinel</span>
            <Lock className="w-4 h-4 text-emerald-500" />
          </div>
          <RadialArcGauge
            value={100}
            unit="%"
            label={`${services.filter((s) => s.isOnline).length} / ${services.length} Online`}
            sublabel="6 Sites Up"
            colorGradient="emerald"
            size="md"
          />
          <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mt-2">
            1 SSL expires in 5 days
          </div>
        </div>
      </div>

      {/* Interactive Bandwidth Timeline Chart & Copilot Quick Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bandwidth Throughput 24h Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span>24-Hour WAN Bandwidth Chart (Throughput & Latency)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Automated multi-stream benchmarks from speedtest background service
              </p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Gigabit Cap: 1000M/500M
            </span>
          </div>

          {/* SVG Area Chart */}
          <div className="w-full h-44 relative pt-2">
            <svg className="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="dlAreaOverview" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="ulAreaOverview" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="40" x2="600" y2="40" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4" />

              {/* Download Curve */}
              <path d="M 0 160 L 0 35 L 100 25 L 200 38 L 300 22 L 400 32 L 500 24 L 600 20 L 600 160 Z" fill="url(#dlAreaOverview)" />
              <path d="M 0 35 L 100 25 L 200 38 L 300 22 L 400 32 L 500 24 L 600 20" fill="none" stroke="#6366f1" strokeWidth="3" />

              {/* Upload Curve */}
              <path d="M 0 160 L 0 95 L 100 90 L 200 102 L 300 88 L 400 92 L 500 86 L 600 84 L 600 160 Z" fill="url(#ulAreaOverview)" />
              <path d="M 0 95 L 100 90 L 200 102 L 300 88 L 400 92 L 500 86 L 600 84" fill="none" stroke="#c084fc" strokeWidth="2.5" />
            </svg>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>Current</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Download (~942 Mbps)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-400"></span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">Upload (~480 Mbps)</span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('speedtest')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Full Speedometer & Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Network Copilot Chat Launcher Card */}
        <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-indigo-200 dark:border-indigo-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Network Copilot Chat</h3>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    ChatController.cs Active
                  </div>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>

            <div className="space-y-2.5 mt-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Ask natural language queries about subnet health, bandwidth gauges, or troubleshoot incidents:
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                <button
                  onClick={() => onNavigate('chat')}
                  className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-400 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  "What is the subnet health & online count?"
                </button>
                <button
                  onClick={() => onNavigate('chat')}
                  className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 hover:border-indigo-400 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  "Are all NAS RAID storage arrays healthy?"
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('chat')}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <MessagesSquare className="w-4 h-4" />
            <span>Open Network Intelligence Chat</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Discovered Devices Glance & Categories */}
        <div className="lg:col-span-2 space-y-6">
          {/* Discovered Devices Table Glance */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Critical Infrastructure & Discovered Nodes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Subnet 192.168.1.0/24 • Real-time ICMP ping streams via SignalR
                </p>
              </div>
              <button
                onClick={() => onNavigate('devices')}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>View All ({devices.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {devices.slice(0, 5).map((device) => (
                <div
                  key={device.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        device.isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{device.customAlias}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                          {device.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>{device.ipAddress}</span>
                        <span>•</span>
                        <span>{device.vendor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {device.pingLatencyMs > 0 ? `${device.pingLatencyMs}ms` : 'Offline'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {device.openPorts.length} Open Ports
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectDeviceForPortScan(device)}
                      className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-[11px] border border-slate-200 dark:border-slate-700/60 transition-colors"
                    >
                      Probe Ports
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage & RAID Array Telemetry Glance */}
          {primaryNas && (
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-500" />
                    <span>{primaryNas.name}</span>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                      {primaryNas.raidStatus}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Host: {primaryNas.hostIp} • OS: {primaryNas.nasType}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('storage')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Manage Storage
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {primaryNas.driveTemperatures.map((drive) => (
                  <div
                    key={drive.drive}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-xs"
                  >
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {drive.drive.split(':')[0]}
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                        {drive.tempC}°C
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {drive.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Google Workspace & Productivity Sync */}
        <div className="space-y-6">
          {/* Google Calendar Agenda Widget */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Today's Calendar Agenda
                </h3>
              </div>
              <button
                onClick={() => onNavigate('google')}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sync
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Fetched via Google Calendar API v3 (OAuth 2.0 Scope)
            </p>

            <div className="space-y-2.5">
              {calendarEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs"
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {evt.summary}
                  </div>
                  <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center justify-between">
                    <span>
                      {new Date(evt.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}{' '}
                      -{' '}
                      {new Date(evt.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {evt.conferenceLink && (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
                        Meet <ArrowUpRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gmail Highlights Widget */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Priority Mailbox Alerts
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300">
                3 Unread
              </span>
            </div>

            <div className="space-y-3">
              {mailHighlights.map((mail) => (
                <div
                  key={mail.id}
                  className="pb-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 text-xs"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {mail.subject}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {mail.from}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {mail.snippet}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* C# Solution Quick Link Card */}
          <div className="rounded-xl bg-indigo-900 text-white p-5 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-xs font-mono font-medium text-indigo-300">
                Principal C# 12 / .NET 9 Clean Architecture
              </div>
              <div className="text-sm font-bold mt-1">
                Zero-Stub Enterprise Backend
              </div>
              <p className="text-xs text-indigo-200/90 mt-1">
                Minimal APIs, Cross-Platform ARP Sweeper, In-Memory OUI Vendor Lookup, SignalR Hub, and Whitelist Auth.
              </p>
              <button
                onClick={() => onNavigate('architecture')}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition-colors"
              >
                <span>Inspect C# Solution Files</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
