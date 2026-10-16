import type { InningsState, BatterStats } from '../../scoring/types';

interface BatterCardProps {
  batter: BatterStats;
  isStriker: boolean;
}

function BatterCard({ batter, isStriker }: BatterCardProps) {
  return (
    <div
      className="p-2.5 sm:p-3 rounded-xl transition-all"
      style={{
        background: isStriker ? 'rgba(245,158,11,0.08)' : 'var(--bg-subtle)',
        border: isStriker ? '1.5px solid rgba(245,158,11,0.40)' : '1px solid var(--border)',
      }}
      aria-label={`${batter.name}${isStriker ? ', on strike' : ''}`}
    >
      {/* Name + badge */}
      <div className="flex items-center gap-1.5 mb-2 min-w-0">
        {isStriker && (
          <span className="striker-badge flex-shrink-0" aria-hidden="true">★</span>
        )}
        <span
          className="text-xs sm:text-sm font-bold truncate"
          style={{ color: isStriker ? '#fbbf24' : 'var(--text-primary)' }}
          title={batter.name}
        >
          {batter.name}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-1 text-center">
        <div>
          <div
            className="text-lg sm:text-xl font-black tabular-nums leading-tight"
            style={{ color: isStriker ? '#ffffff' : 'var(--text-primary)' }}
          >
            {batter.runs}
          </div>
          <div className="text-app-muted text-xs">R</div>
        </div>
        <div>
          <div className="text-app-secondary font-bold text-sm sm:text-base tabular-nums leading-tight">
            {batter.balls}
          </div>
          <div className="text-app-muted text-xs">B</div>
        </div>
        <div>
          <div className="text-blue-400 font-bold text-sm sm:text-base tabular-nums leading-tight">
            {batter.fours}
          </div>
          <div className="text-app-muted text-xs">4s</div>
        </div>
        <div>
          <div className="text-yellow-400 font-bold text-sm sm:text-base tabular-nums leading-tight">
            {batter.sixes}
          </div>
          <div className="text-app-muted text-xs">6s</div>
        </div>
      </div>

      {/* Strike rate */}
      <div className="mt-1.5 text-right">
        <span className="text-app-muted text-xs">SR </span>
        <span className="text-green-500 text-xs font-bold tabular-nums">
          {batter.strikeRate.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

interface BatterInfoProps {
  innings: InningsState;
}

export default function BatterInfo({ innings }: BatterInfoProps) {
  const striker = innings.batterStats[innings.strikerId];
  const nonStriker = innings.batterStats[innings.nonStrikerId];

  const partnershipRuns = innings.currentPartnership?.runs ?? 0;
  const partnershipBalls = innings.currentPartnership?.balls ?? 0;

  if (!striker || !nonStriker) return null;

  return (
    <div className="px-2.5 sm:px-3 py-2" role="region" aria-label="Batting details">
      <div
        className="text-app-muted text-xs uppercase tracking-widest mb-1.5 font-bold px-0.5"
        aria-hidden="true"
      >
        Batting
      </div>
      <div className="grid grid-cols-2 gap-2">
        <BatterCard batter={striker} isStriker={true} />
        <BatterCard batter={nonStriker} isStriker={false} />
      </div>
      {/* Partnership */}
      <div className="mt-1.5 text-center text-xs text-app-muted" aria-label={`Partnership: ${partnershipRuns} runs from ${partnershipBalls} balls`}>
        Partnership:{' '}
        <span className="text-app font-semibold tabular-nums">
          {partnershipRuns} runs ({partnershipBalls} balls)
        </span>
      </div>
    </div>
  );
}
