import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  HardDrive,
  Globe,
  Calendar,
  Gauge,
  Bell,
  Code2,
  Radio,
  ShieldCheck,
  Moon,
  Sun,
  Bot,
  MessagesSquare
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onlineDeviceCount: number;
  totalDeviceCount: number;
  alertCount: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isSignalRConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onlineDeviceCount,
  totalDeviceCount,
  alertCount,
  isDarkMode,
  onToggleTheme,
  isSignalRConnected
}) => {
  const navItems = [
    {
      id: 'overview' as NavigationTab,
      label: 'Home Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'devices' as NavigationTab,
      label: 'Device Discovery',
      icon: Cpu,
      badge: `${onlineDeviceCount}/${totalDeviceCount}`
    },
    {
      id: 'storage' as NavigationTab,
      label: 'NAS & Storage',
      icon: HardDrive,
      badge: '2 Pools'
    },
    {
      id: 'services' as NavigationTab,
      label: 'Web & SSL Monitor',
      icon: Globe,
      badge: '6 Endpoints'
    },
    {
      id: 'chat' as NavigationTab,
      label: 'Sentinel Copilot Chat',
      icon: Bot,
      badge: 'SignalR Hub',
      badgeColor: 'bg-indigo-600 text-white'
    },
    {
      id: 'google' as NavigationTab,
      label: 'Google Workspace',
      icon: Calendar,
      badge: 'OAuth 2.0'
    },
    {
      id: 'speedtest' as NavigationTab,
      label: 'WAN & Bandwidth',
      icon: Gauge,
      badge: 'Gigabit'
    },
    {
      id: 'alerts' as NavigationTab,
      label: 'Alerting Engine',
      icon: Bell,
      badge: alertCount > 0 ? `${alertCount}` : null,
      badgeColor: alertCount > 0 ? 'bg-amber-500 text-white' : undefined
    },
    {
      id: 'architecture' as NavigationTab,
      label: '.NET 9 C# Solution',
      icon: Code2,
      badge: '10 Files',
      badgeColor: 'bg-emerald-600 text-white'
    }
  ];

  return (
    <aside
      id="main-sidebar"
      className="w-64 flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200 select-none"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              HomePulse
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                .NET 9
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Enterprise Network Sentinel
            </div>
          </div>
        </div>
      </div>

      {/* SignalR Connection Status Pill */}
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSignalRConnected ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isSignalRConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">
            {isSignalRConnected ? 'SignalR: /hubs/network' : 'SignalR: Reconnecting'}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">WS 200 OK</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Monitoring & Telemetry
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs border border-indigo-200/60 dark:border-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    item.badgeColor ||
                    (isActive
                      ? 'bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User / Host Info & Theme Switch */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Google Auth Whitelist</span>
          </div>
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label="Toggle Dark Mode"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <div className="px-2 py-2 rounded-lg bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
            AZ
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              azhar.cs@gmail.com
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Verified Allowed User
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
