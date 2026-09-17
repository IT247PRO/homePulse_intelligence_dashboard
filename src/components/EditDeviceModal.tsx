import React, { useState } from 'react';
import { X, Save, Shield, Tag, AlertOctagon } from 'lucide-react';
import { NetworkDevice, DeviceCategory } from '../types';

interface EditDeviceModalProps {
  device: NetworkDevice;
  onClose: () => void;
  onSave: (updated: NetworkDevice) => void;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  device,
  onClose,
  onSave
}) => {
  const [alias, setAlias] = useState(device.customAlias);
  const [category, setCategory] = useState<DeviceCategory>(device.category);
  const [notes, setNotes] = useState(device.notes || '');
  const [isWhitelisted, setIsWhitelisted] = useState(device.isWhitelisted);
  const [isAlertMuted, setIsAlertMuted] = useState(device.isAlertMuted);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...device,
      customAlias: alias.trim() || device.hostname || device.ipAddress,
      category,
      notes: notes.trim(),
      isWhitelisted,
      isAlertMuted
    });
    onClose();
  };

  return (
    <div
      id="edit-device-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="edit-device-modal-content"
        className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Configure Network Node
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {device.ipAddress} • {device.macAddress}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Custom Alias / Device Name
            </label>
            <input
              id="device-alias-input"
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g., Living Room Apple TV 4K"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Resolved Vendor: <span className="font-medium text-slate-600 dark:text-slate-300">{device.vendor}</span>
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Device Category / Role
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(['Infrastructure', 'Storage', 'IoT', 'Mobile', 'Workstation'] as DeviceCategory[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-all ${
                    category === cat
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Device Notes & Topology Remarks
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Connected via Rack Switch Port 14. Static DHCP reservation."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isWhitelisted}
                onChange={(e) => setIsWhitelisted(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium">Mark as Whitelisted Trusted Device</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAlertMuted}
                onChange={(e) => setIsAlertMuted(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <AlertOctagon className="w-3.5 h-3.5 text-slate-400" />
                <span>Mute Disconnect Alerts (do not trigger Discord/Telegram on offline)</span>
              </div>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
