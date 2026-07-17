import React, { useState } from "react";
import { 
  Settings, Moon, Sun, Bell, Database, 
  Check, Key, Cpu 
} from "lucide-react";

interface SettingsViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ darkMode, onToggleDarkMode }) => {
  const [safetyLevel, setSafetyLevel] = useState(() => {
    return localStorage.getItem("aegis_safety_level") || "10";
  });
  const [notifications, setNotifications] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("aegis_safety_level", safetyLevel);
    showToast("Preferences saved successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 rounded-xl shadow-lg flex items-center gap-2 animate-slide-up text-xs font-semibold">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure layout, notification parameters, and data properties.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core preferences */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appearance Config */}
          <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Settings className="w-5 h-5" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Appearance & Styling</h2>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 shadow-sm">
              <div className="space-y-1 pr-4">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Interface Theme Mode</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Toggle between light slate backgrounds and high-contrast dark visualizers.</p>
              </div>
              <button
                onClick={onToggleDarkMode}
                type="button"
                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center gap-2 text-xs font-semibold"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" /> Dark Mode
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Safety Thresholds */}
          <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Telemetry Parameters</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Determine metrics rules for workspace alarms.</p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Default Safety Reorder Level</label>
                  <input
                    type="number"
                    value={safetyLevel}
                    onChange={(e) => setSafetyLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Safety trigger index for automatic low stock tags.</p>
                </div>

                <div className="flex items-center justify-between border border-slate-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/40 p-4 rounded-xl shadow-sm mt-5">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Push Alert Indicators</p>
                    <p className="text-[10px] text-slate-400">Send notifications for stock outages.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications(!notifications)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-indigo-500/10 hover:shadow-lg transition-all"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Database & Telemetry details */}
        <div className="space-y-6">
          {/* Database Specs */}
          <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Database Environment</h2>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="text-slate-400 font-medium">DBMS Engine</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">SQLite v3.x</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="text-slate-400 font-medium">Database Path</span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[155px]" title="instance/inventory.db">instance/inventory.db</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="text-slate-400 font-medium">Connection State</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 font-bold text-[9px] uppercase">Online</span>
              </div>
            </div>
          </div>

          {/* Credentials / API status */}
          <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">API Credentials</h2>
            </div>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="text-slate-400 font-medium">RFID Node Host</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">http://localhost:5000</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                <span className="text-slate-400 font-medium">Telemetry State</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Polling Gate Active</span>
              </div>
            </div>
          </div>

          {/* Hardware Module */}
          <div className="glass-card p-6 bg-white/50 dark:bg-slate-900/50 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-5 h-5" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">RFID Node Telemetry</h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Compatible with <span className="font-semibold text-slate-700 dark:text-slate-200">ESP32 RC522 RFID</span>. Ensure sketches are configured with correct device credentials. Refer to <span className="font-mono bg-slate-100 dark:bg-slate-800 p-0.5 rounded">esp32_rfid.ino</span> inside root path.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
