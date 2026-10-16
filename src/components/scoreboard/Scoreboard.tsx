// ============================================================
// Scoreboard Component – Responsive, themed
// ============================================================

import { Activity, Target } from 'lucide-react';
import type { MatchState, InningsState } from '../../scoring/types';
import { legalBallsToOvers, computeCRR, computeRRR } from '../../scoring/overCalculator';
import { calculateTarget, calculateRunsRequired, calculateBallsRemaining } from '../../scoring/inningsCalculator';

interface ScoreboardProps {
  match: MatchState;
  innings: InningsState;
}

export default function Scoreboard({ match, innings }: ScoreboardProps) {
  const team = match.teams[innings.battingTeamId];
  const isSecondInnings = match.currentInnings === 1;
  const firstInnings = match.innings[0] as InningsState | undefined;

  const crr = computeCRR(innings.totalRuns, innings.legalBalls);
  const oversDisplay = legalBallsToOvers(innings.legalBalls);
  const maxOvers = match.rules.oversPerInnings;

  let target: number | undefined;
  let runsRequired: number | undefined;
  let ballsRemaining: number | undefined;
  let rrr: number | undefined;

  if (isSecondInnings && firstInnings) {
    target = calculateTarget(firstInnings.totalRuns);
    runsRequired = calculateRunsRequired(target, innings.totalRuns);
    ballsRemaining = calculateBallsRemaining(maxOvers, innings.legalBalls);
    rrr = computeRRR(runsRequired, ballsRemaining);
  }

  return (
    <div className="scoreboard-hero text-white relative" role="region" aria-label="Live scoreboard">
      {/* Main score row */}
      <div className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
        {/* Innings label */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-green-400" aria-hidden="true" />
            <span className="text-green-400 text-xs font-bold uppercase tracking-widest">
              {innings.inningsNumber === 1 ? '1st' : '2nd'} Innings
              {innings.status === 'in_progress' && (
                <span className="ml-2 text-red-400">● LIVE</span>
              )}
            </span>
          </div>
          {isSecondInnings && target !== undefined && (
            <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold">
              <Target className="w-3 h-3" aria-hidden="true" />
              Target: {target}
            </div>
          )}
        </div>

        {/* Score + overs */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-green-300 text-sm font-semibold truncate max-w-[160px] sm:max-w-none">
              {team?.name}
            </div>
            <div className="leading-none mt-0.5" aria-label={`Score: ${innings.totalRuns} for ${innings.wickets} wickets`}>
              <span className="text-4xl sm:text-5xl font-black tabular-nums">{innings.totalRuns}</span>
              <span className="text-2xl sm:text-3xl text-gray-400 font-black">/{innings.wickets}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-gray-400 text-xs mb-0.5">Overs</div>
            <div className="text-xl sm:text-2xl font-black tabular-nums">
              {oversDisplay}
              <span className="text-gray-500 text-base font-semibold"> /{maxOvers}</span>
            </div>
            <div className="text-green-300 text-xs mt-0.5 font-semibold">
              CRR: {crr.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Chase strip */}
        {isSecondInnings && runsRequired !== undefined && ballsRemaining !== undefined && rrr !== undefined && (
          <div
            className="mt-2.5 rounded-xl p-2 grid grid-cols-4 gap-1 text-center"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
            role="status"
            aria-label="Chase details"
          >
            <div>
              <div className="text-white font-black text-base tabular-nums">{runsRequired}</div>
              <div className="text-gray-400 text-xs leading-tight">Need</div>
            </div>
            <div>
              <div className="text-white font-black text-base tabular-nums">{ballsRemaining}</div>
              <div className="text-gray-400 text-xs leading-tight">Balls</div>
            </div>
            <div>
              <div className={`font-black text-base tabular-nums ${
                rrr > crr + 3 ? 'text-red-400' : rrr > crr + 1 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {rrr.toFixed(2)}
              </div>
              <div className="text-gray-400 text-xs leading-tight">RRR</div>
            </div>
            <div>
              <div className="text-white font-black text-base tabular-nums">
                {(match.rules.playersPerTeam - 1) - innings.wickets}
              </div>
              <div className="text-gray-400 text-xs leading-tight">Wkts</div>
            </div>
          </div>
        )}

        {/* Extras */}
        {innings.extras.total > 0 && (
          <div className="mt-1.5 text-xs text-gray-400">
            Extras: <span className="text-gray-300 font-medium">{innings.extras.total}</span>
            {innings.extras.wides > 0 && <span className="ml-1">(wd {innings.extras.wides})</span>}
            {innings.extras.noBalls > 0 && <span className="ml-1">(nb {innings.extras.noBalls})</span>}
            {innings.extras.byes > 0 && <span className="ml-1">(b {innings.extras.byes})</span>}
            {innings.extras.legByes > 0 && <span className="ml-1">(lb {innings.extras.legByes})</span>}
          </div>
        )}
      </div>
    </div>
  );
}
