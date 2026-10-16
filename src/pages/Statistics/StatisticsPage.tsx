import { useState } from 'react';
import { useStore } from '../../store/useStore';
import EmptyState from '../../components/common/EmptyState';
import { BarChart2, Zap, Target, Flame, Award, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BatterStats, BowlerStats, MatchState } from '../../scoring/types';

interface PlayerRunRecord {
  name: string;
  runs: number;
  balls: number;
  matches: number;
  highest: number;
  fours: number;
  sixes: number;
  strikeRate: number;
}

interface PlayerWktRecord {
  name: string;
  wickets: number;
  balls: number;
  runsConc: number;
  matches: number;
  bestWkts: number;
  bestRuns: number;
  economy: number;
}

function aggregateStats(matches: MatchState[]) {
  const runMap: Record<string, PlayerRunRecord> = {};
  const wktMap: Record<string, PlayerWktRecord> = {};

  for (const match of matches) {
    for (const inn of match.innings) {
      if (!inn) continue;

      for (const b of Object.values(inn.batterStats) as BatterStats[]) {
        if (!runMap[b.name]) {
          runMap[b.name] = {
            name: b.name,
            runs: 0,
            balls: 0,
            matches: 0,
            highest: 0,
            fours: 0,
            sixes: 0,
            strikeRate: 0,
          };
        }
        runMap[b.name].runs += b.runs;
        runMap[b.name].balls += b.balls;
        runMap[b.name].matches += 1;
        runMap[b.name].fours += b.fours;
        runMap[b.name].sixes += b.sixes;
        runMap[b.name].highest = Math.max(runMap[b.name].highest, b.runs);
      }

      for (const bw of Object.values(inn.bowlerStats) as BowlerStats[]) {
        if (!wktMap[bw.name]) {
          wktMap[bw.name] = {
            name: bw.name,
            wickets: 0,
            balls: 0,
            runsConc: 0,
            matches: 0,
            bestWkts: 0,
            bestRuns: 999,
            economy: 0,
          };
        }
        wktMap[bw.name].wickets += bw.wickets;
        wktMap[bw.name].balls += bw.legalBalls;
        wktMap[bw.name].runsConc += bw.runsConc;
        wktMap[bw.name].matches += 1;

        if (
          bw.wickets > wktMap[bw.name].bestWkts ||
          (bw.wickets === wktMap[bw.name].bestWkts && bw.runsConc < wktMap[bw.name].bestRuns)
        ) {
          wktMap[bw.name].bestWkts = bw.wickets;
          wktMap[bw.name].bestRuns = bw.runsConc;
        }
      }
    }
  }

  // Calculate strike rates and economies
  for (const r of Object.values(runMap)) {
    r.strikeRate = r.balls > 0 ? (r.runs / r.balls) * 100 : 0;
  }
  for (const w of Object.values(wktMap)) {
    w.economy = w.balls > 0 ? (w.runsConc / w.balls) * 6 : 0;
  }

  return {
    topBatters: Object.values(runMap).sort((a, b) => b.runs - a.runs),
    topBowlers: Object.values(wktMap).sort((a, b) => b.wickets - a.wickets || a.economy - b.economy),
  };
}

export default function StatisticsPage() {
  const navigate = useNavigate();
  const { matches } = useStore();
  const [activeTab, setActiveTab] = useState<'batters' | 'bowlers'>('batters');

  if (matches.length === 0) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-app flex items-center justify-center p-4">
        <EmptyState
          icon={<BarChart2 className="w-10 h-10 text-green-500" />}
          title="No Statistics Yet"
          description="Complete some matches to unlock real-time batting leaderboards, bowling records, and run trends."
          action={
            <button className="btn-primary mt-2" onClick={() => navigate('/match/setup')}>
              Start First Match
            </button>
          }
        />
      </div>
    );
  }

  const { topBatters, topBowlers } = aggregateStats(matches);

  const totalRuns = matches.reduce(
    (sum, m) => sum + m.innings.reduce((s, inn) => s + (inn?.totalRuns ?? 0), 0),
    0
  );
  const totalWickets = matches.reduce(
    (sum, m) => sum + m.innings.reduce((s, inn) => s + (inn?.wickets ?? 0), 0),
    0
  );
  const totalFours = matches.reduce(
    (sum, m) =>
      sum +
      m.innings.reduce(
        (s, inn) =>
          s + Object.values(inn?.batterStats ?? {}).reduce((ss: number, b: any) => ss + b.fours, 0),
        0
      ),
    0
  );
  const totalSixes = matches.reduce(
    (sum, m) =>
      sum +
      m.innings.reduce(
        (s, inn) =>
          s + Object.values(inn?.batterStats ?? {}).reduce((ss: number, b: any) => ss + b.sixes, 0),
        0
      ),
    0
  );

  return (
    <div className="min-h-screen bg-app pb-12">
      <div className="page-container space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-app font-black text-2xl sm:text-3xl">Tournament Statistics</h1>
            <p className="text-app-secondary text-sm">
              Aggregated player metrics, boundaries, and career leaderboards across {matches.length} matches.
            </p>
          </div>
          <button
            className="btn-secondary flex items-center gap-1.5 self-start sm:self-auto text-xs sm:text-sm"
            onClick={() => navigate('/history')}
          >
            <span>View All Matches</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Target, label: 'Total Runs', value: totalRuns, color: 'text-green-500', bg: 'bg-green-500/10' },
            { icon: Zap, label: 'Wickets Fallen', value: totalWickets, color: 'text-red-500', bg: 'bg-red-500/10' },
            { icon: Award, label: 'Fours Hit', value: totalFours, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: Flame, label: 'Sixes Hit', value: totalSixes, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map(s => (
            <div key={s.label} className="card p-3.5 sm:p-4 rounded-2xl flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-app font-black text-xl sm:text-2xl tabular-nums leading-none mb-1">
                  {s.value}
                </div>
                <div className="text-app-muted text-xs truncate font-medium">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-app-secondary border border-app max-w-xs">
          <button
            onClick={() => setActiveTab('batters')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'batters'
                ? 'bg-app text-app shadow-xs border border-app'
                : 'text-app-muted hover:text-app'
            }`}
          >
            🏏 Batters ({topBatters.length})
          </button>
          <button
            onClick={() => setActiveTab('bowlers')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'bowlers'
                ? 'bg-app text-app shadow-xs border border-app'
                : 'text-app-muted hover:text-app'
            }`}
          >
            🎳 Bowlers ({topBowlers.length})
          </button>
        </div>

        {/* Batters Leaderboard Table */}
        {activeTab === 'batters' && (
          <div className="card rounded-2xl overflow-hidden shadow-xs border border-app">
            <div className="p-3.5 bg-app-secondary border-b border-app flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold text-app-muted tracking-wider">
                Top Run Scorers
              </span>
              <span className="text-xs text-app-muted">Ranked by total runs</span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">Rank</th>
                    <th className="min-w-[140px]">Player</th>
                    <th className="numeric">Runs</th>
                    <th className="numeric">Innings</th>
                    <th className="numeric">HS</th>
                    <th className="numeric">4s</th>
                    <th className="numeric">6s</th>
                    <th className="numeric">Strike Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topBatters.map((b, i) => (
                    <tr key={b.name} className="hover:bg-app-secondary/40 transition-colors">
                      <td className="text-center font-bold text-xs text-app-muted">
                        {i === 0 ? <span className="text-amber-500 font-black text-sm">🥇 1</span> :
                         i === 1 ? <span className="text-slate-400 font-black text-sm">🥈 2</span> :
                         i === 2 ? <span className="text-amber-700 font-black text-sm">🥉 3</span> :
                         i + 1}
                      </td>
                      <td className="font-bold text-app text-sm sm:text-base">
                        {b.name}
                      </td>
                      <td className="numeric font-black text-green-500 text-base sm:text-lg">
                        {b.runs}
                      </td>
                      <td className="numeric text-app-secondary">{b.matches}</td>
                      <td className="numeric text-blue-500 font-bold">{b.highest}</td>
                      <td className="numeric text-app-muted">{b.fours}</td>
                      <td className="numeric text-amber-500 font-semibold">{b.sixes}</td>
                      <td className="numeric text-app font-bold text-xs tabular-nums">
                        {b.strikeRate.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bowlers Leaderboard Table */}
        {activeTab === 'bowlers' && (
          <div className="card rounded-2xl overflow-hidden shadow-xs border border-app">
            <div className="p-3.5 bg-app-secondary border-b border-app flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold text-app-muted tracking-wider">
                Top Wicket Takers
              </span>
              <span className="text-xs text-app-muted">Ranked by total wickets</span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">Rank</th>
                    <th className="min-w-[140px]">Bowler</th>
                    <th className="numeric">Wickets</th>
                    <th className="numeric">Overs</th>
                    <th className="numeric">Runs</th>
                    <th className="numeric">Best Bowling</th>
                    <th className="numeric">Economy</th>
                  </tr>
                </thead>
                <tbody>
                  {topBowlers.map((bw, i) => (
                    <tr key={bw.name} className="hover:bg-app-secondary/40 transition-colors">
                      <td className="text-center font-bold text-xs text-app-muted">
                        {i === 0 ? <span className="text-amber-500 font-black text-sm">🥇 1</span> :
                         i === 1 ? <span className="text-slate-400 font-black text-sm">🥈 2</span> :
                         i === 2 ? <span className="text-amber-700 font-black text-sm">🥉 3</span> :
                         i + 1}
                      </td>
                      <td className="font-bold text-app text-sm sm:text-base">
                        {bw.name}
                      </td>
                      <td className="numeric font-black text-red-500 text-base sm:text-lg">
                        {bw.wickets}
                      </td>
                      <td className="numeric text-app-secondary">
                        {Math.floor(bw.balls / 6)}.{bw.balls % 6}
                      </td>
                      <td className="numeric text-app font-medium">{bw.runsConc}</td>
                      <td className="numeric text-blue-500 font-bold text-xs">
                        {bw.bestWkts}/{bw.bestRuns === 999 ? '0' : bw.bestRuns}
                      </td>
                      <td className="numeric text-green-500 font-bold text-xs tabular-nums">
                        {bw.economy.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
