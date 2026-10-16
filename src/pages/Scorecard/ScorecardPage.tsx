import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Printer, ArrowLeft, Activity } from 'lucide-react';
import { useStore } from '../../store/useStore';
import EmptyState from '../../components/common/EmptyState';
import { legalBallsToOvers } from '../../scoring/overCalculator';
import type { InningsState, BatterStats, BowlerStats } from '../../scoring/types';

function InningsScorecard({ innings, teams }: { innings: InningsState; teams: Record<string, any> }) {
  const battingTeam = teams[innings.battingTeamId];
  const bowlingTeam = teams[innings.bowlingTeamId];

  const batters = Object.values(innings.batterStats) as BatterStats[];
  const bowlers = Object.values(innings.bowlerStats) as BowlerStats[];

  return (
    <div className="space-y-4">
      {/* Innings Overview Hero */}
      <div
        className="p-4 rounded-2xl text-white shadow-md relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f4c1e 0%, #0d2e10 100%)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-green-300 text-xs sm:text-sm font-semibold uppercase tracking-wider">
              {battingTeam?.name || 'Batting Team'}
            </div>
            <div className="text-3xl sm:text-4xl font-black mt-0.5 tabular-nums">
              {innings.totalRuns}
              <span className="text-2xl text-green-200/80">/{innings.wickets}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-gray-300 text-xs">Overs</div>
            <div className="text-xl sm:text-2xl font-bold tabular-nums">
              {legalBallsToOvers(innings.legalBalls)}
            </div>
            <div className="text-green-300 text-xs mt-0.5">
              CRR: {(innings.legalBalls > 0 ? (innings.totalRuns / innings.legalBalls) * 6 : 0).toFixed(2)}
            </div>
          </div>
        </div>

        {innings.extras.total > 0 && (
          <div className="mt-3 pt-2 border-t border-white/10 text-xs text-gray-300 flex flex-wrap gap-x-3 gap-y-1">
            <span><strong>Extras:</strong> {innings.extras.total}</span>
            {innings.extras.wides > 0 && <span>(wd {innings.extras.wides})</span>}
            {innings.extras.noBalls > 0 && <span>(nb {innings.extras.noBalls})</span>}
            {innings.extras.byes > 0 && <span>(b {innings.extras.byes})</span>}
            {innings.extras.legByes > 0 && <span>(lb {innings.extras.legByes})</span>}
          </div>
        )}
      </div>

      {/* Batting Table */}
      <div className="card rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3 bg-app-secondary border-b border-app flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold text-app-muted tracking-wider">
            Batting Scorecard
          </span>
          <span className="text-xs text-app-muted">
            {batters.filter(b => b.balls > 0 || b.isOut).length} batters
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th className="min-w-[140px]">Batter</th>
                <th className="numeric">R</th>
                <th className="numeric">B</th>
                <th className="numeric">4s</th>
                <th className="numeric">6s</th>
                <th className="numeric">SR</th>
              </tr>
            </thead>
            <tbody>
              {batters.map((b) => (
                <tr key={b.playerId}>
                  <td>
                    <div className="font-semibold text-app text-sm flex items-center gap-1.5">
                      <span>{b.name}</span>
                      {b.isStriker && <span className="striker-badge text-[8px] py-0 px-1">STRIKE</span>}
                    </div>
                    <div className="text-xs text-app-muted mt-0.5">
                      {b.dismissalInfo ? (
                        <span className="text-red-500/80 font-medium">{b.dismissalInfo}</span>
                      ) : b.isRetiredHurt ? (
                        <span className="text-amber-500 font-medium">retired hurt</span>
                      ) : (
                        <span className="text-green-500 font-semibold">not out</span>
                      )}
                    </div>
                  </td>
                  <td className="numeric font-black text-app text-base">{b.runs}</td>
                  <td className="numeric text-app-secondary">{b.balls}</td>
                  <td className="numeric text-blue-500 font-bold">{b.fours}</td>
                  <td className="numeric text-amber-500 font-bold">{b.sixes}</td>
                  <td className="numeric text-green-500 font-bold text-xs">{b.strikeRate.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets */}
      {innings.fallOfWickets.length > 0 && (
        <div className="card rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="text-xs uppercase font-extrabold text-app-muted tracking-wider mb-2">
            Fall of Wickets
          </div>
          <div className="flex flex-wrap gap-2">
            {innings.fallOfWickets.map(f => (
              <div
                key={f.wicketNumber}
                className="px-2.5 py-1.5 rounded-xl border border-app bg-app-secondary text-xs flex items-center gap-1.5"
              >
                <span className="font-extrabold text-red-500">{f.score}-{f.wicketNumber}</span>
                <span className="text-app-secondary truncate max-w-[120px]">({f.batterName})</span>
                <span className="text-app-muted">{f.overs} ov</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bowling Table */}
      <div className="card rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3 bg-app-secondary border-b border-app flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold text-app-muted tracking-wider">
            Bowling — {bowlingTeam?.name || 'Opponent'}
          </span>
          <span className="text-xs text-app-muted">{bowlers.length} bowlers</span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th className="min-w-[140px]">Bowler</th>
                <th className="numeric">O</th>
                <th className="numeric">M</th>
                <th className="numeric">R</th>
                <th className="numeric">W</th>
                <th className="numeric">Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowlers.map((b) => (
                <tr key={b.playerId}>
                  <td className="font-semibold text-app text-sm">{b.name}</td>
                  <td className="numeric text-app-secondary font-medium">{b.overs}</td>
                  <td className="numeric text-app-muted">{b.maidens}</td>
                  <td className="numeric text-app font-bold">{b.runsConc}</td>
                  <td className="numeric font-black text-red-500 text-base">{b.wickets}</td>
                  <td className="numeric text-green-500 font-bold text-xs">{b.economy.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Over History Timeline */}
      {innings.overHistory.length > 0 && (
        <div className="card rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="text-xs uppercase font-extrabold text-app-muted tracking-wider mb-2.5">
            Over By Over Summary
          </div>
          <div className="space-y-2">
            {innings.overHistory.map(o => (
              <div
                key={o.overNumber}
                className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl bg-app-secondary text-xs"
              >
                <div className="font-extrabold text-app-muted w-10 sm:w-12 flex-shrink-0">
                  Ov {o.overNumber}
                </div>
                <div className="font-semibold text-app truncate w-24 sm:w-28 flex-shrink-0">
                  {o.bowlerName}
                </div>
                <div className="flex gap-1 flex-1 overflow-x-auto py-0.5">
                  {o.balls.map((b, i) => {
                    const isW = b.includes('W');
                    const is4 = b === '4';
                    const is6 = b === '6';
                    const isEx = b.includes('wd') || b.includes('nb');
                    return (
                      <span
                        key={i}
                        className={`over-ball text-[10px] sm:text-xs font-bold ${
                          isW ? 'bg-red-500/20 text-red-500 border-red-500' :
                          is4 ? 'bg-blue-500/20 text-blue-500 border-blue-500' :
                          is6 ? 'bg-amber-500/20 text-amber-500 border-amber-500' :
                          isEx ? 'bg-purple-500/20 text-purple-400 border-purple-400' :
                          'text-app-secondary border-app bg-app'
                        }`}
                      >
                        {b}
                      </span>
                    );
                  })}
                </div>
                <div className="text-right flex-shrink-0 tabular-nums">
                  <span className="font-black text-app">{o.runs}r</span> ·{' '}
                  <span className="font-black text-red-500">{o.wickets}w</span>
                  {o.isMaiden && <span className="ml-1 text-green-500 font-bold">M</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScorecardPage() {
  const navigate = useNavigate();
  const { currentMatch } = useStore();
  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  if (!currentMatch) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-app flex items-center justify-center p-4">
        <EmptyState
          title="No Match Selected"
          description="Select an existing match from the dashboard or history to inspect its complete scorecard."
          action={
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          }
        />
      </div>
    );
  }

  const inn1 = currentMatch.innings[0];
  const inn2 = currentMatch.innings[1];
  const isLive = currentMatch.status === 'live' || currentMatch.status === 'paused';

  return (
    <div className="min-h-screen bg-app pb-12">
      <div className="page-container space-y-5">
        
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between gap-3 pt-2 no-print">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost text-xs sm:text-sm px-2.5 py-1.5 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="btn-secondary text-xs sm:text-sm px-3 py-1.5 flex items-center gap-1.5"
              title="Print Scorecard"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Scorecard</span>
            </button>

            {isLive && (
              <button
                className="btn-primary text-xs sm:text-sm px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm"
                onClick={() => navigate('/live')}
              >
                <Activity className="w-4 h-4 text-white" />
                <span>Return to Live</span>
              </button>
            )}
          </div>
        </div>

        {/* Match Title & Result Card */}
        <div className="card rounded-2xl p-4 sm:p-5 shadow-sm border border-app space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                  {currentMatch.format} Match
                </span>
                <span className="text-xs text-app-muted">{currentMatch.date}</span>
                {currentMatch.venue && (
                  <span className="text-xs text-app-muted truncate">· {currentMatch.venue}</span>
                )}
              </div>
              <h1 className="text-app font-black text-xl sm:text-2xl">{currentMatch.name}</h1>
            </div>

            {currentMatch.toss && (
              <div className="text-xs text-app-secondary bg-app-secondary p-2 rounded-xl self-start sm:self-auto">
                <strong>Toss:</strong> {currentMatch.teams[currentMatch.toss.winnerTeamId]?.name} elected to {currentMatch.toss.decision}
              </div>
            )}
          </div>

          {currentMatch.result && (
            <div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20 flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="text-app font-bold text-sm sm:text-base">
                {currentMatch.result.description}
              </div>
            </div>
          )}
        </div>

        {/* Innings Tabs */}
        {inn2 && (
          <div className="flex gap-2 p-1.5 rounded-2xl bg-app-secondary border border-app max-w-md no-print">
            <button
              onClick={() => setActiveTab(0)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 0
                  ? 'bg-app text-app shadow-sm border border-app'
                  : 'text-app-muted hover:text-app'
              }`}
            >
              <span>1st Innings</span>
              {inn1 && (
                <span className="text-[11px] font-black text-green-500 tabular-nums">
                  {inn1.totalRuns}/{inn1.wickets}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab(1)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 1
                  ? 'bg-app text-app shadow-sm border border-app'
                  : 'text-app-muted hover:text-app'
              }`}
            >
              <span>2nd Innings</span>
              {inn2 && (
                <span className="text-[11px] font-black text-green-500 tabular-nums">
                  {inn2.totalRuns}/{inn2.wickets}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Selected Innings Scorecard */}
        {activeTab === 0 && inn1 && (
          <InningsScorecard innings={inn1} teams={currentMatch.teams} />
        )}

        {activeTab === 1 && inn2 && (
          <InningsScorecard innings={inn2} teams={currentMatch.teams} />
        )}

        {!inn2 && inn1 && activeTab === 0 && (
          <div className="text-xs text-app-muted italic pt-2">
            2nd Innings has not started yet.
          </div>
        )}

      </div>
    </div>
  );
}
