import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  compact?: boolean;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95"
        style={{
          background: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(15,16,51,0.08)',
          border: `1px solid ${isDark ? 'rgba(251,191,36,0.25)' : 'rgba(0,0,0,0.12)'}`,
          color: isDark ? '#fbbf24' : '#334155',
        }}
      >
        {isDark
          ? <Sun className="w-4 h-4" />
          : <Moon className="w-4 h-4" />
        }
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
      {(['light', 'dark'] as const).map(t => {
        const isActive = effectiveTheme === t;
        const Icon = t === 'light' ? Sun : Moon;
        return (
          <button
            key={t}
            onClick={() => toggleTheme()}
            aria-label={`${t} theme`}
            title={`Switch to ${t} theme`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
            style={{
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'white' : 'var(--text-muted)',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {t}
          </button>
        );
      })}
    </div>
  );
}
