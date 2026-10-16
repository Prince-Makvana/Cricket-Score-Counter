// ============================================================
// Live Scoring Page – Fully Responsive (Mobile-First + Multi-Column Desktop)
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pause, FileText, MoreVertical, ChevronRight, AlertTriangle
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { InningsState, WicketInfo, DeliveryInput } from '../../scoring/types';
import Scoreboard from '../../components/scoreboard/Scoreboard';
import BatterInfo from '../../components/scoreboard/BatterInfo';
import BowlerInfo from '../../components/scoreboard/BowlerInfo';
import ScoringControls from '../../components/scoring/ScoringControls';
import WicketModal from '../../components/scoring/WicketModal';
import EndOverModal from '../../components/scoring/EndOverModal';
import InningsBreakModal from '../../components/scoring/InningsBreakModal';
import MatchCompleteModal from '../../components/scoring/MatchCompleteModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function LiveScoringPage() {
  const navigate = useNavigate();
  const {
    currentMatch,
    activeModal,
    closeModal,
    recordDelivery,
    undoLastDelivery,
    endInnings,
    startNextInnings,
    changeBowler,
    pauseMatch,
  } = useStore();

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pendingWicketNoBall, setPendingWicketNoBall] = useState(false);
  const [pendingWicketWide, setPendingWicketWide] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentMatch) navigate('/dashboard');
  }, [currentMatch, navigate]);

  // Click outside to close dropdown menu
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  if (!currentMatch) return null;

  const innings = currentMatch.innings[currentMatch.currentInnings] as InningsState | undefined;
  if (!innings) return null;

  const canUndo = innings.deliveries.length > 0;

  // ─── Scoring Handlers ─────────────────────────────────────

  const handleScore = (input: DeliveryInput) => {
    recordDelivery(input);
  };

  const handleWicketOpen = (isNoBall = false, isWide = false) => {
    setPendingWicketNoBall(isNoBall);
    setPendingWicketWide(isWide);
    setShowWicketModal(true);
  };

  const handleWicketConfirm = (wicket: WicketInfo, runs: number) => {
    recordDelivery({
      batterRuns: runs,
      isWide: pendingWicketWide,
      isNoBall: pendingWicketNoBall,
      isBye: false,
      isLegBye: false,
      isWicket: true,
      wicket,
      extraRuns: 0,
      bowlerId: innings.currentBowlerId,
    });
    setShowWicketModal(false);
  };

  const handleUndo = () => {
    undoLastDelivery();
    closeModal();
  };

  // ─── Match Completed View ─────────────────────────────────

  if (currentMatch.status === 'completed' && currentMatch.result) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-app flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mb-4 text-4xl shadow-inner">
          🏆
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-green-500 mb-1">
          Match Concluded
        </span>
        <h2 className="text-app font-black text-2xl sm:text-4xl mb-2">{currentMatch.name}</h2>
        <p className="text-app-secondary text-base sm:text-lg max-w-md mb-8 font-medium">
          {currentMatch.result.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button className="btn-primary w-full justify-center" onClick={() => navigate('/scorecard')}>
            <FileText className="w-4 h-4" /> View Full Scorecard
          </button>
          <button className="btn-secondary w-full justify-center" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-app flex flex-col pb-6">
      {/* Top sticky match action bar */}
      <div
        className="sticky top-14 z-30 glass border-b px-3 sm:px-6 py-2 flex items-center justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-app truncate">
            {currentMatch.name}
          </span>
          <span className="hidden md:inline-block text-xs px-2 py-0.5 rounded-full bg-app-secondary text-app-muted font-medium">
            {currentMatch.format} · {currentMatch.rules.oversPerInnings} ov
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 relative" ref={menuRef}>
          <button
            onClick={() => { pauseMatch(); navigate('/dashboard'); }}
            className="btn-ghost text-xs px-2 sm:px-3 py-1.5 h-8"
            id="pause-match"
            title="Pause and return to dashboard"
          >
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pause</span>
          </button>

          <button
            onClick={() => navigate('/scorecard')}
            className="btn-secondary text-xs px-2.5 sm:px-3 py-1.5 h-8"
            id="view-scorecard"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scorecard</span>
          </button>

          <button
            onClick={() => setShowMenu(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-app-secondary hover:text-app hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            id="more-options"
            aria-label="More match options"
            aria-expanded={showMenu}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Context dropdown menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-10 z-40 card rounded-xl overflow-hidden shadow-2xl py-1 animate-slide-up"
              style={{ minWidth: 180, background: 'var(--bg-card)' }}
            >
              <button
                className="w-full text-left px-3.5 py-2.5 text-app text-xs sm:text-sm hover:bg-app-secondary flex items-center gap-2 font-medium"
                onClick={() => { setShowConfirmEnd(true); setShowMenu(false); }}
                id="end-innings-btn"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                End Innings Early
              </button>
              <button
                className="w-full text-left px-3.5 py-2.5 text-app text-xs sm:text-sm hover:bg-app-secondary flex items-center gap-2 font-medium"
                onClick={() => { navigate('/match/setup'); setShowMenu(false); }}
                id="new-match-from-menu"
              >
                <ChevronRight className="w-4 h-4 text-green-500" />
                Start New Match
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: Responsive Multi-Column on Desktop */}
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 pt-3 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
          
          {/* Left Column (Desktop: 7 cols) -> Scoreboard, Batter stats, Bowler stats */}
          <div className="lg:col-span-7 space-y-3">
            {/* Scoreboard Card */}
            <div className="rounded-2xl overflow-hidden shadow-md border border-app">
              <Scoreboard match={currentMatch} innings={innings} />
            </div>

            {/* Live Batter Details */}
            <div className="card rounded-2xl shadow-xs overflow-hidden">
              <BatterInfo innings={innings} />
            </div>

            {/* Live Bowler Details */}
            <div className="card rounded-2xl shadow-xs overflow-hidden">
              <BowlerInfo innings={innings} />
            </div>
          </div>

          {/* Right Column (Desktop: 5 cols) -> Scoring Console & Quick Controls */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-3">
            <div className="card rounded-2xl p-2 sm:p-3 shadow-md border border-app">
              <div className="flex items-center justify-between px-2 pt-1 pb-1">
                <span className="text-xs uppercase font-extrabold text-app-muted tracking-wider">
                  Score Delivery
                </span>
                <span className="text-[11px] text-app-muted">
                  Striker: <strong className="text-app">{innings.batterStats[innings.strikerId]?.name}</strong>
                </span>
              </div>

              <ScoringControls
                onScore={handleScore}
                onUndo={handleUndo}
                onWicket={() => handleWicketOpen(false, false)}
                currentBowlerId={innings.currentBowlerId}
                canUndo={canUndo}
                isNoBallFreeHit={innings.nextFreeHit}
              />
            </div>

            {/* Desktop Helper Card */}
            <div className="hidden lg:block card rounded-xl p-3 text-xs text-app-muted">
              <div className="font-semibold text-app mb-1">Keyboard Shortcuts</div>
              <div className="grid grid-cols-2 gap-1.5">
                <div><kbd className="px-1.5 py-0.5 rounded bg-app-secondary border font-mono">0-6</kbd> Score runs</div>
                <div><kbd className="px-1.5 py-0.5 rounded bg-app-secondary border font-mono">W</kbd> Record wicket</div>
                <div><kbd className="px-1.5 py-0.5 rounded bg-app-secondary border font-mono">Ctrl+Z</kbd> Undo ball</div>
                <div><kbd className="px-1.5 py-0.5 rounded bg-app-secondary border font-mono">Esc</kbd> Cancel extra</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      <WicketModal
        isOpen={showWicketModal}
        onClose={() => setShowWicketModal(false)}
        onConfirm={handleWicketConfirm}
        innings={innings}
        match={currentMatch}
        isNoBall={pendingWicketNoBall}
        isWide={pendingWicketWide}
      />

      <EndOverModal
        isOpen={activeModal === 'end_over'}
        onClose={closeModal}
        onSelectBowler={changeBowler}
        innings={innings}
        match={currentMatch}
      />

      {currentMatch.innings[0] && (
        <InningsBreakModal
          isOpen={activeModal === 'innings_break'}
          onClose={closeModal}
          onStartInnings={startNextInnings}
          match={currentMatch}
          completedInnings={currentMatch.innings[0] as InningsState}
        />
      )}

      <MatchCompleteModal
        isOpen={activeModal === 'match_complete'}
        onClose={closeModal}
        match={currentMatch}
      />

      <ConfirmDialog
        isOpen={showConfirmEnd}
        onClose={() => setShowConfirmEnd(false)}
        onConfirm={endInnings}
        title="End Innings?"
        message="Are you sure you want to end the current innings? The team's batting innings will be marked completed."
        confirmLabel="End Innings"
        danger
      />
    </div>
  );
}
