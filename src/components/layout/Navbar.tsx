import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Trophy, Home, BarChart2, Users, User,
  PlusCircle, History, Settings, Activity
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import ThemeToggle from '../theme/ThemeToggle';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/match/setup', label: 'New Match', icon: PlusCircle },
  { to: '/live', label: 'Live', icon: Activity },
  { to: '/history', label: 'History', icon: History },
  { to: '/teams', label: 'Teams', icon: Users },
  { to: '/players', label: 'Players', icon: User },
  { to: '/statistics', label: 'Stats', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentMatch } = useStore();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isLive = currentMatch && (currentMatch.status === 'live' || currentMatch.status === 'paused');

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass-dark safe-top"
        style={{ borderBottom: '1px solid var(--navbar-border)' }}
        ref={menuRef}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-display font-bold text-lg sm:text-xl flex-shrink-0"
            aria-label="CricketMate home"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <Trophy className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span style={{ color: 'var(--navbar-text)' }}>
              Cricket<span className="text-green-500">Mate</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5" role="navigation" aria-label="Main navigation">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-green-600/90 text-white shadow-sm'
                      : 'hover:bg-white/10 dark:hover:bg-white/8'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'white' : 'var(--navbar-text-muted)',
                })}
              >
                <item.icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden xl:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live match pill */}
            {isLive && (
              <button
                onClick={() => navigate('/live')}
                className="live-badge text-xs"
                aria-label="Resume live match"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
                <span className="hidden sm:inline">LIVE</span>
              </button>
            )}

            {/* Theme toggle – compact on mobile */}
            <ThemeToggle compact />

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(v => !v)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:bg-white/10"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-menu"
              style={{ color: 'var(--navbar-text)' }}
            >
              {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
          className={`lg:hidden transition-all duration-250 overflow-hidden ${open ? 'max-h-screen' : 'max-h-0'}`}
          style={{ borderTop: open ? '1px solid var(--navbar-border)' : 'none' }}
        >
          <div
            className="px-3 py-3 pb-4 safe-bottom"
            style={{ background: 'var(--navbar-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-green-600 text-white' : ''
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'white' : 'var(--navbar-text)',
                    background: isActive ? '' : 'transparent',
                  })}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'var(--bg-overlay)' }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
