import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, ShieldAlert, Cpu, Terminal } from 'lucide-react';
import { NetworkDevice } from '../types';
import { NetworkSimulationEngine, PortScanResult } from '../services/networkSimulation';

interface PortScanModalProps {
  device: NetworkDevice;
  onClose: () => void;
  onUpdateOpenPorts: (deviceId: string, openPorts: number[]) => void;
}

export const PortScanModal: React.FC<PortScanModalProps> = ({
  device,
  onClose,
  onUpdateOpenPorts
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [results, setResults] = useState<PortScanResult[]>([]);

  useEffect(() => {
    runScan();
  }, [device.ipAddress]);

  const runScan = async () => {
    setIsScanning(true);
    const scanResults = await NetworkSimulationEngine.simulatePortScan(device.ipAddress, device.openPorts);
    setResults(scanResults);
    setIsScanning(false);
  };

  const handleApplyPorts = () => {
    const openPorts = results.filter(r => r.state === 'Open').map(r => r.port);
    onUpdateOpenPorts(device.id, openPorts);
    onClose();
  };

  const openCount = results.filter(r => r.state === 'Open').length;

  return (
    <div
      id="port-scan-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="port-scan-modal-content"
        className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                TCP Port Probe & Service Fingerprint
                {isScanning && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 animate-pulse">
                    Probing Sockets...
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Target: {device.ipAddress} ({device.customAlias}) • Vendor: {device.vendor}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scan Results Console / Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Status: </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isScanning ? 'Multi-threaded socket connection test in progress...' : `Scan Completed. Detected ${openCount} open service ports.`}
              </span>
            </div>
            <button
              onClick={runScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-[11px]"
            >
              <Play className="w-3 h-3" />
              <span>Rescan Target</span>
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Port</th>
                  <th className="py-2.5 px-4">Service Protocol</th>
                  <th className="py-2.5 px-4">State</th>
                  <th className="py-2.5 px-4">Fingerprint Banner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((res) => {
                  const isOpen = res.state === 'Open';
                  return (
                    <tr
                      key={res.port}
                      className={isOpen ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'opacity-70'}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {res.port}/tcp
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {res.service}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isOpen
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isOpen ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Open
                            </>
                          ) : (
                            'Closed'
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {res.banner || 'Connection refused (RST/ACK)'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Powered by .NET 9 Minimal API <code className="font-mono text-indigo-600 dark:text-indigo-400">/api/devices/{'{id}'}/scan-ports</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </button>
            <button
              onClick={handleApplyPorts}
              disabled={isScanning}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
            >
              Update Device Ports ({openCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
