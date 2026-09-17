import React, { useState } from 'react';
import {
  Cpu,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Terminal,
  Shield,
  ShieldAlert,
  Server,
  Smartphone,
  HardDrive,
  Laptop,
  Wifi,
  Activity,
  CheckCircle2,
  XCircle,
  Tag
} from 'lucide-react';
import { NetworkDevice, DeviceCategory } from '../types';

interface DeviceDiscoveryViewProps {
  devices: NetworkDevice[];
  onEditDevice: (device: NetworkDevice) => void;
  onPortScan: (device: NetworkDevice) => void;
  onTriggerScan: () => void;
  isScanning: boolean;
}

export const DeviceDiscoveryView: React.FC<DeviceDiscoveryViewProps> = ({
  devices,
  onEditDevice,
  onPortScan,
  onTriggerScan,
  isScanning
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterQuery, setFilterQuery] = useState('');
  const [onlyOnline, setOnlyOnline] = useState(false);

  const categories: (DeviceCategory | 'All')[] = [
    'All',
    'Infrastructure',
    'Storage',
    'IoT',
    'Mobile',
    'Workstation'
  ];

  const getCategoryIcon = (category: DeviceCategory) => {
    switch (category) {
      case 'Infrastructure':
        return <Server className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Storage':
        return <HardDrive className="w-3.5 h-3.5 text-cyan-500" />;
      case 'Mobile':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-500" />;
      case 'Workstation':
        return <Laptop className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const filtered = devices.filter((d) => {
    if (onlyOnline && !d.isOnline) return false;
    if (selectedCategory !== 'All' && d.category !== selectedCategory) return false;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      return (
        d.customAlias.toLowerCase().includes(q) ||
        d.ipAddress.includes(q) ||
        d.macAddress.toLowerCase().includes(q) ||
        d.vendor.toLowerCase().includes(q) ||
        d.hostname.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner and Controls */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Automated Subnet Device Inventory</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filtered.length} nodes listed
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Engine: Linux <code className="font-mono text-indigo-500">/proc/net/arp</code> + Windows <code className="font-mono text-indigo-500">SendARP</code> & IEEE OUI Vendor Resolution
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by IP, MAC, name, vendor..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shrink-0 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Rescan Subnet'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Online Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={onlyOnline}
            onChange={(e) => setOnlyOnline(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Show Online Only</span>
        </label>
      </div>

      {/* Devices Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((device) => (
          <div
            key={device.id}
            id={`device-card-${device.macAddress.replace(/:/g, '')}`}
            className={`p-4 rounded-xl border transition-all ${
              device.isOnline
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800'
                : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/50 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    device.isOnline
                      ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800'
                  }`}
                >
                  {getCategoryIcon(device.category)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="truncate max-w-[180px]">{device.customAlias}</span>
                    {device.isWhitelisted && (
                      <span title="Trusted Whitelisted Device">
                        <Shield className="w-3 h-3 text-emerald-500" />
                      </span>
                    )}
                  </h4>
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {device.ipAddress}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    device.isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {device.isOnline ? `${device.pingLatencyMs}ms` : 'Offline'}
                </span>
              </div>
            </div>

            {/* Hardware & OUI Specs */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Manufacturer (OUI):</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                  {device.vendor}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">MAC Address:</span>
                <span className="text-slate-600 dark:text-slate-400">{device.macAddress}</span>
              </div>
              {device.hostname && (
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Reverse DNS:</span>
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                    {device.hostname}
                  </span>
                </div>
              )}
            </div>

            {/* Open Ports Badges */}
            <div className="mt-3">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Fingerprinted Services ({device.openPorts.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {device.openPorts.length > 0 ? (
                  device.openPorts.map((port) => (
                    <span
                      key={port}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                    >
                      :{port}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No standard TCP ports exposed</span>
                )}
              </div>
            </div>

            {/* Notes snippet if any */}
            {device.notes && (
              <div className="mt-2.5 p-2 rounded bg-slate-50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {device.notes}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                Last seen: {new Date(device.lastSeenUtc).toLocaleTimeString()}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onPortScan(device)}
                  title="Run TCP Port Fingerprint Scan"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors"
                >
                  <Terminal className="w-3 h-3 text-indigo-500" />
                  <span>Probe</span>
                </button>

                <button
                  onClick={() => onEditDevice(device)}
                  title="Edit Alias and Role Category"
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800/60 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
