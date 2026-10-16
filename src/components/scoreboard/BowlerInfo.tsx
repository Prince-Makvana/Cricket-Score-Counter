import type { InningsState } from '../../scoring/types';
import { getBallDisplayString } from '../../scoring/overCalculator';

interface BowlerInfoProps {
  innings: InningsState;
}

export default function BowlerInfo({ innings }: BowlerInfoProps) {
  const bowler = innings.bowlerStats[innings.currentBowlerId];
  if (!bowler) return null;

  const currentOverBalls = innings.currentOverBalls;
  const legalInOver = currentOverBalls.filter(d => !d.isWide && !d.isNoBall).length;

  return (
    <div className="px-2.5 sm:px-3 py-2" role="region" aria-label="Bowling details">
      <div className="text-app-muted text-xs uppercase tracking-widest mb-1.5 font-bold px-0.5">
        Bowling
      </div>
      <div className="card p-2.5 sm:p-3 rounded-xl transition-all">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-app font-bold text-sm sm:text-base truncate">{bowler.name}</div>
            <div className="text-app-muted text-xs font-medium">{bowler.overs} ov · {bowler.maidens} M</div>
          </div>
          <div className="flex gap-3 sm:gap-4 text-right flex-shrink-0">
            <div>
              <div className="text-app font-black text-sm sm:text-base tabular-nums">{bowler.runsConc}</div>
              <div className="text-app-muted text-xs">Runs</div>
            </div>
            <div>
              <div className="text-red-500 font-black text-sm sm:text-base tabular-nums">{bowler.wickets}</div>
              <div className="text-app-muted text-xs">Wkts</div>
            </div>
            <div>
              <div className="text-green-500 font-bold text-sm sm:text-base tabular-nums">{bowler.economy.toFixed(2)}</div>
              <div className="text-app-muted text-xs">Econ</div>
            </div>
          </div>
        </div>

        {/* Current over delivery sequence */}
        <div className="border-t border-app pt-2 mt-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-app-muted text-xs font-semibold">This Over</span>
            <span className="text-app-muted text-xs tabular-nums">{legalInOver}/6 legal balls</span>
          </div>
          <div className="flex gap-1.5 items-center flex-wrap">
            {currentOverBalls.length === 0 && (
              <span className="text-app-muted text-xs italic py-1">Ready for first ball</span>
            )}
            {currentOverBalls.map((d, i) => {
              const label = getBallDisplayString(d);
              const isWicket = label.includes('W');
              const isFour = d.batterRuns === 4 && !d.isWide && !d.isNoBall;
              const isSix = d.batterRuns === 6 && !d.isWide && !d.isNoBall;
              const isExtra = d.isWide || d.isNoBall;
              return (
                <div
                  key={d.id || `ball-${i}`}
                  className={`over-ball text-xs font-bold transition-transform shadow-xs ${
                    isWicket
                      ? 'bg-red-500/20 text-red-500 border-red-500'
                      : isFour
                      ? 'bg-blue-500/20 text-blue-500 border-blue-500'
                      : isSix
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500'
                      : isExtra
                      ? 'bg-purple-500/20 text-purple-400 border-purple-400'
                      : 'text-app-secondary border-app bg-app-secondary'
                  }`}
                  title={`Ball ${i + 1}: ${label}`}
                >
                  {label}
                </div>
              );
            })}
            {/* Remaining legal balls in this over */}
            {Array.from({ length: Math.max(0, 6 - legalInOver) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="over-ball text-xs text-app-muted border-app opacity-40"
                aria-hidden="true"
              >
                ·
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
