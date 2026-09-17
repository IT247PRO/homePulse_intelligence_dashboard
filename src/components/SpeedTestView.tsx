import React, { useState } from 'react';
import {
  Gauge,
  ArrowDown,
  ArrowUp,
  Activity,
  Play,
  CheckCircle2,
  Server,
  Zap,
  Clock
} from 'lucide-react';
import { SpeedTestRecord } from '../types';
import { NetworkSimulationEngine } from '../services/networkSimulation';
import { SpeedometerGauge, RadialArcGauge } from './Gauges';

interface SpeedTestViewProps {
  history: SpeedTestRecord[];
  onAddRecord: (record: SpeedTestRecord) => void;
}

export const SpeedTestView: React.FC<SpeedTestViewProps> = ({
  history,
  onAddRecord
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [stepMessage, setStepMessage] = useState('');
  const [stepPercent, setStepPercent] = useState(0);

  const latest = history[0] || {
    id: 'st-default',
    timestampUtc: new Date().toISOString(),
    downloadMbps: 942.5,
    uploadMbps: 480.2,
    pingLatencyMs: 7.8,
    jitterMs: 1.1,
    serverLocation: 'Cloudflare Edge (Chicago Datacenter)',
    clientIp: '73.168.45.12'
  };

  const handleStartBenchmark = async () => {
    setIsRunning(true);
    setStepMessage('Initializing bandwidth benchmark...');
    setStepPercent(5);

    const record = await NetworkSimulationEngine.simulateSpeedTest((msg, pct) => {
      setStepMessage(msg);
      setStepPercent(pct);
    });

    onAddRecord(record);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner and Quick Trigger */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>WAN Bandwidth & Speed Test Daemon</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              Gigabit Symmetric Capable
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Daemon worker <code className="font-mono text-indigo-500">SpeedTestService.cs</code> executing scheduled 4-hour benchmarks against CDN PoPs
          </p>
        </div>

        <button
          onClick={handleStartBenchmark}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Benchmarking...' : 'Run Benchmark Now'}</span>
        </button>
      </div>

      {/* Live Benchmark Progress Bar when running */}
      {isRunning && (
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-200 font-semibold">
            <span>{stepMessage}</span>
            <span className="font-mono">{stepPercent}%</span>
          </div>
          <div className="w-full bg-indigo-200 dark:bg-indigo-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${stepPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Dual Tachometer Speedometer Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpeedometerGauge
          value={latest.downloadMbps}
          max={1000}
          title="Download Throughput Tachometer"
          unit="Mbps"
          accentColor="indigo"
          peakBurst={968.4}
        />
        <SpeedometerGauge
          value={latest.uploadMbps}
          max={500}
          title="Upload Throughput Tachometer"
          unit="Mbps"
          accentColor="purple"
          peakBurst={494.2}
        />
      </div>

      {/* Latency and Jitter Telemetry Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Ping Latency</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {latest.pingLatencyMs} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[10px] text-emerald-500 font-mono mt-0.5">Cloudflare Edge RTT</div>
          </div>
          <Activity className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Jitter Variance</span>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {latest.jitterMs} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[10px] text-indigo-500 font-mono mt-0.5">Ultra-low bufferbloat</div>
          </div>
          <Zap className="w-8 h-8 text-indigo-500/30" />
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Line Utilization</span>
            <div className="text-2xl font-bold font-mono text-emerald-500 mt-1">
              94.3%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Gigabit Symmetric</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Server PoP</span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-[150px]">
              Chicago Edge
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Cloudflare Anycast</div>
          </div>
          <Server className="w-8 h-8 text-purple-500/30" />
        </div>
      </div>

      {/* Historical Bandwidth Bar Chart */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Bandwidth Stability Timeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Logged to SQLite / PostgreSQL via EF Core <code className="text-indigo-500">SpeedTestRecords</code> table
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-400">
            Past 24 Hours
          </span>
        </div>

        {/* CSS/SVG Visual Graph */}
        <div className="space-y-3 pt-2">
          {history.slice(0, 5).map((rec) => (
            <div key={rec.id} className="space-y-1 text-xs">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  {new Date(rec.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {rec.serverLocation}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Down: {rec.downloadMbps} Mbps / Up: {rec.uploadMbps} Mbps ({rec.pingLatencyMs}ms)
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-md overflow-hidden flex gap-0.5">
                <div
                  className="bg-indigo-600 h-full rounded-l-md"
                  style={{ width: `${(rec.downloadMbps / 1000) * 65}%` }}
                  title={`Download: ${rec.downloadMbps} Mbps`}
                />
                <div
                  className="bg-purple-500 h-full rounded-r-md"
                  style={{ width: `${(rec.uploadMbps / 1000) * 35}%` }}
                  title={`Upload: ${rec.uploadMbps} Mbps`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
