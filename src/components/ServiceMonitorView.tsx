import React, { useState } from 'react';
import {
  Globe,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { MonitoredService } from '../types';

interface ServiceMonitorViewProps {
  services: MonitoredService[];
  onAddService: (service: MonitoredService) => void;
  onDeleteService: (id: string) => void;
}

export const ServiceMonitorView: React.FC<ServiceMonitorViewProps> = ({
  services,
  onAddService,
  onDeleteService
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [expectedCode, setExpectedCode] = useState(200);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    const newSrv: MonitoredService = {
      id: 'srv-' + Date.now(),
      name: name.trim(),
      targetUrl: url.trim(),
      expectedStatusCode: expectedCode,
      checkIntervalSeconds: 60,
      isOnline: true,
      lastStatusCode: 200,
      responseLatencyMs: 18.5,
      sslCertExpiryUtc: '2027-01-01T00:00:00Z',
      sslDaysRemaining: 105,
      isEnabled: true,
      lastCheckedUtc: new Date().toISOString()
    };

    onAddService(newSrv);
    setName('');
    setUrl('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Websites & SSL Sentinel Monitor</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {services.length} endpoints
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            HTTP/HTTPS status probe, latency benchmarking, and automated SSL expiration alert (&lt; 7 days)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Monitored URL</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const isSslExpiringSoon =
            service.sslDaysRemaining !== undefined && service.sslDaysRemaining < 7;

          return (
            <div
              key={service.id}
              className={`p-5 rounded-xl border bg-white dark:bg-slate-900 shadow-xs space-y-4 transition-all ${
                isSslExpiringSoon
                  ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/20 dark:bg-amber-950/10'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                      service.isOnline
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{service.name}</span>
                    </h3>
                    <a
                      href={service.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-slate-400 hover:text-indigo-500 flex items-center gap-1 truncate max-w-[200px]"
                    >
                      <span>{service.targetUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteService(service.id)}
                  title="Remove Service"
                  className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status & Latency Pills */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
                  <div className="text-[10px] text-slate-400">HTTP Status</div>
                  <div className="mt-1 flex items-center gap-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        service.isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                    <span>{service.lastStatusCode} OK</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
                  <div className="text-[10px] text-slate-400">RTT Latency</div>
                  <div className="mt-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {service.responseLatencyMs}ms
                  </div>
                </div>
              </div>

              {/* SSL Certificate Countdown */}
              {service.sslCertExpiryUtc && service.sslDaysRemaining !== undefined ? (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    isSslExpiringSoon
                      ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSslExpiringSoon ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-[11px]">
                        SSL Certificate Expiry
                      </div>
                      <div className="text-[10px] opacity-80 font-mono">
                        {new Date(service.sslCertExpiryUtc).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold text-sm ${
                        isSslExpiringSoon
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {service.sslDaysRemaining}d
                    </div>
                    <div className="text-[10px] opacity-75">
                      {isSslExpiringSoon ? 'Renew Urgent!' : 'Valid'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 text-[11px] text-slate-400 font-mono">
                  Plain HTTP / No SSL Encrypted Handshake
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Interval: {service.checkIntervalSeconds}s</span>
                <span>Checked: {new Date(service.lastCheckedUtc).toLocaleTimeString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div
          id="add-service-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            id="add-service-modal-content"
            className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Add Monitored HTTP/HTTPS Target
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Friendly Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vaultwarden Password Vault"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Endpoint URL
                </label>
                <input
                  type="url"
                  placeholder="https://vault.homepulse.lan"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected HTTP Status Code
                </label>
                <input
                  type="number"
                  value={expectedCode}
                  onChange={(e) => setExpectedCode(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs"
                >
                  Add Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
