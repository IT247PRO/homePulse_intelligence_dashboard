import React from 'react';
import {
  HardDrive,
  Cpu,
  Database,
  Thermometer,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { NasStorageNode } from '../types';
import { RingGauge, DriveThermalGauge } from './Gauges';

interface StorageNasViewProps {
  nasNodes: NasStorageNode[];
}

export const StorageNasView: React.FC<StorageNasViewProps> = ({ nasNodes }) => {
  const formatBytes = (bytes: number) => {
    const tb = bytes / 1_000_000_000_000;
    return `${tb.toFixed(1)} TB`;
  };

  const getDriveTempColor = (tempC: number) => {
    if (tempC < 40) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800';
    if (tempC < 48) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800';
    return 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Info */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>NAS & Storage Infrastructure Telemetry</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              All Arrays Healthy
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            SNMP v2c & REST Daemon polling Synology DSM & TrueNAS ZFS status every 30s
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Database className="w-4 h-4 text-cyan-500" />
            <span>Total Capacity: 40 TB</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Active Pools: 2</span>
          </div>
        </div>
      </div>

      {/* Nodes Stack */}
      <div className="space-y-6">
        {nasNodes.map((node) => {
          const usedFormatted = formatBytes(node.diskUsedBytes);
          const totalFormatted = formatBytes(node.diskTotalBytes);
          const percentUsed = Math.round((node.diskUsedBytes / node.diskTotalBytes) * 100);

          return (
            <div
              key={node.id}
              className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
            >
              {/* Node Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{node.name}</span>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {node.nasType}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Static IP: {node.hostIp} • SNMP Community: public • Last Polled: {new Date(node.lastUpdatedUtc).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{node.raidStatus}</span>
                  </span>
                </div>
              </div>

              {/* Resource Utilization Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Storage Pool Ring Gauge */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
                      <Database className="w-4 h-4 text-cyan-500" />
                      <span>Pool Allocation</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                      {usedFormatted} / {totalFormatted}
                    </div>
                    <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                      SHR-1 Redundancy
                    </div>
                  </div>
                  <RingGauge
                    percent={percentUsed}
                    label="Disk Fill"
                    size={68}
                    strokeWidth={7}
                    color="cyan"
                  />
                </div>

                {/* CPU Utilization Ring Gauge */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      <span>CPU Load</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                      Intel Celeron J4125
                    </div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                      4 Cores @ 2.0 GHz
                    </div>
                  </div>
                  <RingGauge
                    percent={node.cpuUsagePercent}
                    label="Load"
                    size={68}
                    strokeWidth={7}
                    color="indigo"
                  />
                </div>

                {/* RAM Utilization Ring Gauge */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-bold">
                      <Activity className="w-4 h-4 text-purple-500" />
                      <span>RAM Memory</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                      18 GB DDR4 ECC
                    </div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                      ZFS Cache Active
                    </div>
                  </div>
                  <RingGauge
                    percent={node.ramUsagePercent}
                    label="RAM"
                    size={68}
                    strokeWidth={7}
                    color="purple"
                  />
                </div>
              </div>

              {/* Individual Drive Temperatures & SMART Gauges */}
              <div>
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-amber-500" />
                    <span>Physical Drive Health & Temperature Dials</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Safe range: 25°C - 45°C • SMART Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {node.driveTemperatures.map((dt) => (
                    <DriveThermalGauge
                      key={dt.drive}
                      bayName={dt.drive}
                      tempC={dt.tempC}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
