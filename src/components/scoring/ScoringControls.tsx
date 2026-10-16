import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, XCircle, Zap } from 'lucide-react';
import type { DeliveryInput } from '../../scoring/types';

interface ScoringControlsProps {
  onScore: (input: DeliveryInput) => void;
  onUndo: () => void;
  onWicket: () => void;
  currentBowlerId: string;
  canUndo: boolean;
  isNoBallFreeHit: boolean;
}

export default function ScoringControls({
  onScore, onUndo, onWicket, currentBowlerId, canUndo, isNoBallFreeHit
}: ScoringControlsProps) {
  const [pendingExtra, setPendingExtra] = useState<'bye' | 'legbye' | 'wide' | 'noball' | null>(null);

  const scoreRuns = useCallback((batterRuns: number) => {
    if (pendingExtra === 'wide') {
      onScore({
        batterRuns: 0,
        isWide: true,
        isNoBall: false,
        isBye: false,
        isLegBye: false,
        isWicket: false,
        extraRuns: batterRuns, // additional running/bye runs on wide
        bowlerId: currentBowlerId,
      });
    } else if (pendingExtra === 'noball') {
      onScore({
        batterRuns,
        isWide: false,
        isNoBall: true,
        isBye: false,
        isLegBye: false,
        isWicket: false,
        extraRuns: 0,
        bowlerId: currentBowlerId,
      });
    } else if (pendingExtra === 'bye') {
      onScore({
        batterRuns: 0,
        isWide: false,
        isNoBall: false,
        isBye: true,
        isLegBye: false,
        isWicket: false,
        extraRuns: batterRuns,
        bowlerId: currentBowlerId,
      });
    } else if (pendingExtra === 'legbye') {
      onScore({
        batterRuns: 0,
        isWide: false,
        isNoBall: false,
        isBye: false,
        isLegBye: true,
        isWicket: false,
        extraRuns: batterRuns,
        bowlerId: currentBowlerId,
      });
    } else {
      onScore({
        batterRuns,
        isWide: false,
        isNoBall: false,
        isBye: false,
        isLegBye: false,
        isWicket: false,
        extraRuns: 0,
        bowlerId: currentBowlerId,
      });
    }
    setPendingExtra(null);
  }, [pendingExtra, onScore, currentBowlerId]);

  const handleWideClick = () => {
    if (pendingExtra === 'wide') {
      // If tapped again, record wide with 0 extra runs
      onScore({
        batterRuns: 0,
        isWide: true,
        isNoBall: false,
        isBye: false,
        isLegBye: false,
        isWicket: false,
        extraRuns: 0,
        bowlerId: currentBowlerId,
      });
      setPendingExtra(null);
    } else {
      setPendingExtra('wide');
    }
  };

  const handleNoBallClick = () => {
    if (pendingExtra === 'noball') {
      // If tapped again, record basic no-ball with 0 off the bat
      onScore({
        batterRuns: 0,
        isWide: false,
        isNoBall: true,
        isBye: false,
        isLegBye: false,
        isWicket: false,
        extraRuns: 0,
        bowlerId: currentBowlerId,
      });
      setPendingExtra(null);
    } else {
      setPendingExtra('noball');
    }
  };

  // Keyboard shortcut support for desktop scorekeepers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or modal is open
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key >= '0' && e.key <= '6') {
        scoreRuns(parseInt(e.key, 10));
      } else if (e.key === 'w' || e.key === 'W') {
        if (!e.ctrlKey && !e.metaKey) {
          onWicket();
        }
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (canUndo) onUndo();
      } else if (e.key === 'Escape') {
        setPendingExtra(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scoreRuns, canUndo, onWicket, onUndo]);

  const runValues = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="px-2.5 sm:px-3 py-3 space-y-2.5" role="region" aria-label="Scoring Controls">
      {/* Free hit notification */}
      {isNoBallFreeHit && (
        <div
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border animate-pulse"
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            color: 'var(--warning)',
          }}
          role="alert"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
            FREE HIT NEXT BALL
          </span>
        </div>
      )}

      {/* Pending extra prompt banner */}
      {pendingExtra && (
        <div
          className="flex items-center justify-between py-2 px-3 rounded-xl border animate-slide-up"
          style={{
            background: 'var(--accent-subtle)',
            borderColor: 'var(--accent)',
            color: 'var(--text-primary)',
          }}
          role="status"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            <span>
              {pendingExtra === 'wide' ? 'Wide Ball — Tap runs or tap WD for 1 wd' :
               pendingExtra === 'noball' ? 'No-Ball — Select runs scored off bat' :
               pendingExtra === 'bye' ? 'Bye — Select runs completed' :
               'Leg Bye — Select runs completed'}
            </span>
          </div>
          <button
            onClick={() => setPendingExtra(null)}
            className="flex items-center gap-1 text-xs text-app-muted hover:text-red-500 transition-colors px-2 py-1"
            aria-label="Cancel extra selection"
          >
            <XCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </div>
      )}

      {/* Main Runs & Wicket Grid */}
      <div className="grid grid-cols-4 gap-2">
        {runValues.map(r => (
          <button
            key={r}
            id={`score-${r}`}
            onClick={() => scoreRuns(r)}
            className={`score-run-btn ${
              r === 4 ? 'btn-4' : r === 6 ? 'btn-6' : ''
            }`}
            style={{
              minHeight: '3.75rem',
            }}
            aria-label={
              pendingExtra
                ? `${pendingExtra} plus ${r} runs`
                : `${r} runs`
            }
          >
            <span>{r}</span>
            {r === 4 && <span className="absolute bottom-1 text-[9px] font-bold tracking-tight opacity-70">FOUR</span>}
            {r === 6 && <span className="absolute bottom-1 text-[9px] font-bold tracking-tight opacity-70">SIX</span>}
          </button>
        ))}

        {/* Wicket button */}
        <button
          id="score-wicket"
          className="score-run-btn btn-wicket"
          style={{ minHeight: '3.75rem' }}
          onClick={onWicket}
          aria-label="Record Wicket"
        >
          <div className="flex flex-col items-center">
            <span className="text-xl font-black">OUT</span>
            <span className="text-[9px] tracking-wider font-bold uppercase opacity-85">Wicket</span>
          </div>
        </button>
      </div>

      {/* Extras buttons row */}
      <div className="grid grid-cols-4 gap-2">
        <button
          id="score-wide"
          className={`score-run-btn btn-wide font-black ${
            pendingExtra === 'wide' ? 'ring-2 ring-purple-500 ring-offset-2' : ''
          }`}
          style={{ minHeight: '3rem', fontSize: '0.85rem' }}
          onClick={handleWideClick}
          aria-label="Wide Ball"
        >
          <span>WD</span>
        </button>

        <button
          id="score-noball"
          className={`score-run-btn btn-noball font-black ${
            pendingExtra === 'noball' ? 'ring-2 ring-red-500 ring-offset-2' : ''
          }`}
          style={{ minHeight: '3rem', fontSize: '0.85rem' }}
          onClick={handleNoBallClick}
          aria-label="No Ball"
        >
          <span>NB</span>
        </button>

        <button
          id="score-bye"
          className={`score-run-btn font-black ${
            pendingExtra === 'bye' ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
          }`}
          style={{
            minHeight: '3rem',
            fontSize: '0.85rem',
            borderColor: 'var(--warning)',
            color: 'var(--warning)',
          }}
          onClick={() => setPendingExtra(pendingExtra === 'bye' ? null : 'bye')}
          aria-label="Bye"
        >
          <span>BYE</span>
        </button>

        <button
          id="score-legbye"
          className={`score-run-btn font-black ${
            pendingExtra === 'legbye' ? 'ring-2 ring-amber-500 ring-offset-2' : ''
          }`}
          style={{
            minHeight: '3rem',
            fontSize: '0.85rem',
            borderColor: '#f97316',
            color: '#f97316',
          }}
          onClick={() => setPendingExtra(pendingExtra === 'legbye' ? null : 'legbye')}
          aria-label="Leg Bye"
        >
          <span>LB</span>
        </button>
      </div>

      {/* Undo Button */}
      <button
        id="score-undo"
        className="btn-secondary w-full justify-center text-sm font-semibold py-2.5 transition-all"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo last recorded delivery"
        title={canUndo ? "Undo last ball (Ctrl+Z)" : "No deliveries to undo"}
      >
        <RotateCcw className="w-4 h-4 mr-1.5" />
        <span>Undo Last Ball</span>
      </button>
    </div>
  );
}
