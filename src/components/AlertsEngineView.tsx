import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Send,
  Radio,
  MessageSquare,
  Smartphone,
  ShieldAlert,
  Clock,
  Trash2
} from 'lucide-react';
import { SystemAlert, AlertSeverity } from '../types';

interface AlertsEngineViewProps {
  alerts: SystemAlert[];
  onTriggerTestAlert: () => void;
  onToggleResolve: (id: string) => void;
}

export const AlertsEngineView: React.FC<AlertsEngineViewProps> = ({
  alerts,
  onTriggerTestAlert,
  onToggleResolve
}) => {
  const [discordWebhook, setDiscordWebhook] = useState(
    'https://discord.com/api/webhooks/1234567890/token_sample'
  );
  const [telegramChatId, setTelegramChatId] = useState('@HomePulseAlerts');
  const [ntfyTopic, setNtfyTopic] = useState('homepulse-network-alerts');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Warning':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner and Quick Test Button */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Multi-Channel Webhook & Alerting Engine</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {alerts.length} Logged Incidents
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time triggers on Critical Device Drop, SSL &lt; 7 Days, or Unknown Wi-Fi MAC Address
          </p>
        </div>

        <button
          onClick={onTriggerTestAlert}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch Test Alert</span>
        </button>
      </div>

      {/* Webhook Destinations Configuration */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-500" />
          <span>Active Webhook Destinations (appsettings.json / AlertDispatcherService.cs)</span>
        </h3>

        <form onSubmit={handleSaveConfigs} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Discord */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span>Discord Rich Embeds</span>
            </div>
            <p className="text-[11px] text-slate-400">Webhook URL:</p>
            <input
              type="text"
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
            />
          </div>

          {/* Telegram */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <Send className="w-4 h-4 text-sky-500" />
              <span>Telegram Bot API</span>
            </div>
            <p className="text-[11px] text-slate-400">Target Chat ID:</p>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
            />
          </div>

          {/* ntfy.sh */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>ntfy.sh Mobile Push</span>
            </div>
            <p className="text-[11px] text-slate-400">Topic Identifier:</p>
            <input
              type="text"
              value={ntfyTopic}
              onChange={(e) => setNtfyTopic(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
            />
          </div>

          <div className="md:col-span-3 flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-400">
              {savedSuccess && (
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Webhook routes successfully stored to runtime config
                </span>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs transition-colors"
            >
              Update Endpoints
            </button>
          </div>
        </form>
      </div>

      {/* Alerts Feed */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Historical Incident Log & Real-Time Feed
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {alerts.filter((a) => !a.isResolved).length} Unresolved
          </span>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                alert.isResolved
                  ? 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getSeverityBadge(
                      alert.severity
                    )}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {alert.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(alert.timestampUtc).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => onToggleResolve(alert.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                      alert.isResolved
                        ? 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    {alert.isResolved ? 'Mark Unresolved' : 'Acknowledge & Resolve'}
                  </button>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {alert.message}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Origin Engine: {alert.source}</span>
                <div className="flex items-center gap-1.5">
                  <span>Dispatched:</span>
                  {alert.dispatchedWebhooks.map((w) => (
                    <span
                      key={w}
                      className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
