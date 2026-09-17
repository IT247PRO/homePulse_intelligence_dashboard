import React from 'react';
import {
  Search,
  RefreshCw,
  Activity,
  AlertTriangle,
  Network
} from 'lucide-react';
import { ScanProgress } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSubnet: string;
  onSelectSubnet: (subnet: string) => void;
  scanProgress: ScanProgress;
  onTriggerScan: () => void;
  onlineCount: number;
  totalCount: number;
  averageLatencyMs: number;
  warningCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedSubnet,
  onSelectSubnet,
  scanProgress,
  onTriggerScan,
  onlineCount,
  totalCount,
  averageLatencyMs,
  warningCount
}) => {
  return (
    <header
      id="main-header"
      className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-6 flex items-center justify-between shrink-0 sticky top-0 z-20"
    >
      {/* Left Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search devices, IP, MAC, services, or vendor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Subnet selector */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
          <Network className="w-3.5 h-3.5 text-indigo-500" />
          <select
            id="subnet-select"
            value={selectedSubnet}
            onChange={(e) => onSelectSubnet(e.target.value)}
            className="bg-transparent text-xs font-mono font-medium focus:outline-hidden cursor-pointer"
          >
            <option value="192.168.1.0/24">192.168.1.0/24 (Main LAN)</option>
            <option value="192.168.20.0/24">192.168.20.0/24 (IoT VLAN 20)</option>
            <option value="10.0.0.0/24">10.0.0.0/24 (Server Lab)</option>
          </select>
        </div>
      </div>

      {/* Right Quick Telemetry & Scan Trigger */}
      <div className="flex items-center gap-3">
        {/* Quick telemetry chips */}
        <div className="hidden lg:flex items-center gap-4 text-xs pr-2 border-r border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500 dark:text-slate-400">Hosts:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {onlineCount}/{totalCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-slate-500 dark:text-slate-400">Avg Latency:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {averageLatencyMs}ms
            </span>
          </div>

          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{warningCount} Alerts</span>
            </div>
          )}
        </div>

        {/* Scan Button */}
        <button
          id="trigger-scan-btn"
          disabled={scanProgress.isScanning}
          onClick={onTriggerScan}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition-all ${
            scanProgress.isScanning
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanProgress.isScanning ? 'animate-spin' : ''}`} />
          <span>{scanProgress.isScanning ? 'Scanning...' : 'Sweep Subnet'}</span>
        </button>
      </div>
    </header>
  );
};
