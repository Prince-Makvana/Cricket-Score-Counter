import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useTheme } from '../../components/theme/ThemeProvider';
import type { Theme, MatchFormat } from '../../scoring/types';
import {
  Sun, Moon, Monitor, Trash2, AlertTriangle, Download, Upload, Check
} from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const THEMES: { value: Theme; label: string; icon: typeof Sun; desc: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, desc: 'Clean, high-contrast outdoor theme' },
  { value: 'dark', label: 'Dark', icon: Moon, desc: 'Deep charcoal cricket theme' },
  { value: 'system', label: 'System', icon: Monitor, desc: 'Match your device preferences' },
];

const FORMATS: MatchFormat[] = ['T20', 'ODI', 'T10', 'The Hundred', 'Custom'];

export default function SettingsPage() {
  const { settings, saveSettings, loadAll } = useStore();
  const { theme, setTheme } = useTheme();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    saveSettings({ theme: t });
  };

  const clearAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Export full JSON backup
  const handleExportData = () => {
    try {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('cricketmate_') || key === 'cricketmate_theme')) {
          data[key] = localStorage.getItem(key);
        }
      }
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CricketMate-Backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export data.');
    }
  };

  // Import JSON backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid format');

        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') {
            localStorage.setItem(k, v);
          }
        }
        loadAll();
        setImportStatus('Backup restored successfully!');
        setTimeout(() => setImportStatus(null), 4000);
      } catch {
        alert('Could not import backup file. Invalid CricketMate JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-app pb-12">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-app font-black text-2xl sm:text-3xl">Application Settings</h1>
          <p className="text-app-secondary text-sm">
            Customize appearance, default match rules, and manage your local data backups.
          </p>
        </div>

        {/* Appearance & Themes */}
        <div className="card rounded-2xl p-4 sm:p-5 space-y-3.5 border border-app shadow-xs">
          <div>
            <h2 className="text-app font-bold text-base sm:text-lg">Appearance & Theme</h2>
            <p className="text-app-muted text-xs">
              Select your preferred visual style. All pages and scorecards update instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {THEMES.map(t => {
              const isSelected = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => handleThemeChange(t.value)}
                  className={`p-3.5 rounded-xl border flex flex-col items-start gap-1.5 transition-all text-left ${
                    isSelected
                      ? 'border-green-500 bg-green-500/10 text-green-500 shadow-xs'
                      : 'border-app text-app hover:border-green-500/30 bg-app-secondary'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center gap-2">
                    <t.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-extrabold text-sm">{t.label}</span>
                  </div>
                  <span className="text-[11px] text-app-muted leading-relaxed">{t.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Match Defaults */}
        <div className="card rounded-2xl p-4 sm:p-5 space-y-4 border border-app shadow-xs">
          <div>
            <h2 className="text-app font-bold text-base sm:text-lg">Match Scoring Defaults</h2>
            <p className="text-app-muted text-xs">
              Pre-populate the match setup wizard with your local league or club rules.
            </p>
          </div>

          <div>
            <label className="block text-app-muted text-xs mb-1.5 font-extrabold uppercase tracking-wider">
              Default Format
            </label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map(f => (
                <button
                  key={f}
                  onClick={() => saveSettings({ defaultFormat: f })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    settings.defaultFormat === f
                      ? 'bg-green-600 border-green-600 text-white shadow-xs'
                      : 'border-app text-app-secondary hover:border-green-500/50 bg-app-secondary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
                Default Overs / Innings
              </label>
              <input
                type="number"
                min={1}
                max={50}
                className="input-field text-sm"
                value={settings.defaultOvers}
                onChange={e => saveSettings({ defaultOvers: parseInt(e.target.value, 10) || 20 })}
              />
            </div>

            <div>
              <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
                Players per Team
              </label>
              <input
                type="number"
                min={2}
                max={15}
                className="input-field text-sm"
                value={settings.defaultPlayersPerTeam}
                onChange={e => saveSettings({ defaultPlayersPerTeam: parseInt(e.target.value, 10) || 11 })}
              />
            </div>

            <div>
              <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
                Wide Penalty Runs
              </label>
              <input
                type="number"
                min={1}
                max={3}
                className="input-field text-sm"
                value={settings.defaultWidePenalty}
                onChange={e => saveSettings({ defaultWidePenalty: parseInt(e.target.value, 10) || 1 })}
              />
            </div>

            <div>
              <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
                No-Ball Penalty Runs
              </label>
              <input
                type="number"
                min={1}
                max={3}
                className="input-field text-sm"
                value={settings.defaultNoBallPenalty}
                onChange={e => saveSettings({ defaultNoBallPenalty: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-app">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-app text-sm font-bold">Free Hit on No-Ball</div>
                <div className="text-app-muted text-xs">
                  Batter cannot be dismissed off the next ball (except run out, hit ball twice, obstructing field).
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={settings.freeHitEnabled}
                onClick={() => saveSettings({ freeHitEnabled: !settings.freeHitEnabled })}
                className={`toggle-switch ${settings.freeHitEnabled ? 'active' : ''}`}
                aria-label="Toggle Free Hit on No-Ball"
              />
            </div>
          </div>
        </div>

        {/* Data Backup & Restore */}
        <div className="card rounded-2xl p-4 sm:p-5 space-y-3.5 border border-app shadow-xs">
          <div>
            <h2 className="text-app font-bold text-base sm:text-lg">Data Backup & Sync</h2>
            <p className="text-app-muted text-xs">
              Export all matches, registered squads, and scorecards to a single JSON backup file, or restore one.
            </p>
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{importStatus}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleExportData}
              className="btn-secondary flex-1 justify-center text-xs sm:text-sm py-2.5"
            >
              <Download className="w-4 h-4" />
              <span>Export Backup (JSON)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex-1 justify-center text-xs sm:text-sm py-2.5"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportData}
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card rounded-2xl p-4 sm:p-5 space-y-3 border border-red-500/20 bg-red-500/5 shadow-xs">
          <div className="flex items-center gap-2 text-red-500 font-black text-base sm:text-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>Danger Zone</span>
          </div>
          <p className="text-app-secondary text-xs sm:text-sm leading-relaxed">
            Permanently clear all matches, scores, registered teams, players, and custom settings from this device's browser localStorage.
          </p>

          <button
            className="btn-danger flex items-center gap-2 text-xs sm:text-sm py-2.5 px-4"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Local Data</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center text-app-muted text-xs pt-2">
          CricketMate v1.0.0 · Local-first, zero-server offline sports architecture
        </div>

        <ConfirmDialog
          isOpen={showClearConfirm}
          onClose={() => setShowClearConfirm(false)}
          onConfirm={clearAllData}
          title="Reset All CricketMate Data?"
          message="This will immediately and irrevocably erase all matches, custom rules, player profiles, and teams stored in your browser. Are you sure?"
          confirmLabel="Erase Everything"
          danger
        />

      </div>
    </div>
  );
}
