import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Activity, Clock, CheckCircle2, Users, User, Trophy,
  ChevronRight, ArrowRight, Play, Flame
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import EmptyState from '../../components/common/EmptyState';
import type { MatchState } from '../../scoring/types';

function MatchCard({ match, onClick }: { match: MatchState; onClick: () => void }) {
  const team1 = match.teams[match.team1Id];
  const team2 = match.teams[match.team2Id];
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  const statusColor = match.status === 'live' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                      match.status === 'completed' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
                      match.status === 'paused' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' :
                      'text-app-muted bg-app-secondary border-app';

  const statusLabel = match.status === 'live' ? 'LIVE' :
                      match.status === 'completed' ? 'Completed' :
                      match.status === 'paused' ? 'Paused' : match.status;

  return (
    <button
      onClick={onClick}
      className="card card-hover w-full text-left p-3.5 sm:p-4 rounded-2xl group transition-all"
      aria-label={`Match: ${match.name}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0 pr-2">
          <div className="text-app font-bold text-sm sm:text-base truncate group-hover:text-green-500 transition-colors">
            {match.name}
          </div>
          <div className="text-app-muted text-xs truncate">
            {match.date} {match.venue ? `· ${match.venue}` : ''} · {match.format}
          </div>
        </div>
        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor} flex-shrink-0`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center justify-between py-2 border-y border-app text-sm">
        <div className="min-w-0">
          <div className="text-app font-semibold text-xs sm:text-sm truncate">{team1?.name}</div>
          {inn1 ? (
            <div className="text-app font-black text-base sm:text-lg tabular-nums">
              {inn1.totalRuns}<span className="text-xs font-normal text-app-muted">/{inn1.wickets}</span>
            </div>
          ) : (
            <span className="text-xs text-app-muted">Yet to bat</span>
          )}
        </div>

        <div className="text-app-muted text-xs font-extrabold px-3 uppercase tracking-widest">
          vs
        </div>

        <div className="text-right min-w-0">
          <div className="text-app font-semibold text-xs sm:text-sm truncate">{team2?.name}</div>
          {inn2 ? (
            <div className="text-app font-black text-base sm:text-lg tabular-nums">
              {inn2.totalRuns}<span className="text-xs font-normal text-app-muted">/{inn2.wickets}</span>
            </div>
          ) : (
            <span className="text-xs text-app-muted">Yet to bat</span>
          )}
        </div>
      </div>

      {match.result && (
        <div className="mt-2 text-xs text-green-500 font-semibold truncate flex items-center gap-1">
          <Trophy className="w-3 h-3 flex-shrink-0" />
          <span>{match.result.description}</span>
        </div>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { matches, loadMatch, teams, players } = useStore();

  const liveMatch = matches.find(m => m.status === 'live' || m.status === 'paused');
  const recentMatches = [...matches].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const completedMatches = matches.filter(m => m.status === 'completed');

  const handleMatchClick = (match: MatchState) => {
    loadMatch(match.id);
    if (match.status === 'live' || match.status === 'paused') {
      navigate('/live');
    } else {
      navigate('/scorecard');
    }
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="page-container space-y-6">
        
        {/* Top Welcome / Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-app font-black text-2xl sm:text-3xl">Dashboard</h1>
            <p className="text-app-secondary text-sm">
              Manage matches, track statistics, and score live cricket seamlessly.
            </p>
          </div>
          <button
            className="btn-primary shadow-md flex items-center justify-center gap-2"
            onClick={() => navigate('/match/setup')}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start New Match</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Trophy, label: 'Total Matches', value: matches.length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { icon: Activity, label: 'Live / Active', value: matches.filter(m => m.status === 'live' || m.status === 'paused').length, color: 'text-red-500', bg: 'bg-red-500/10' },
            { icon: CheckCircle2, label: 'Completed', value: completedMatches.length, color: 'text-green-500', bg: 'bg-green-500/10' },
            { icon: Users, label: 'Saved Teams', value: teams.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          ].map(s => (
            <div key={s.label} className="card p-3 sm:p-4 rounded-2xl flex items-center gap-3">
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

        {/* Live Match Alert Card (if any) */}
        {liveMatch && (
          <div
            className="rounded-2xl p-4 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-md transition-all hover:border-red-500/50"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 16, 51, 0.02) 100%)',
            }}
            onClick={() => handleMatchClick(liveMatch)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleMatchClick(liveMatch)}
            aria-label={`Resume active match ${liveMatch.name}`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="text-red-500 font-extrabold text-xs uppercase tracking-wider">
                  {liveMatch.status === 'paused' ? 'Paused Match' : 'Match In Progress'}
                </span>
                <span className="text-xs text-app-muted">· {liveMatch.format}</span>
              </div>
              <div className="text-app font-black text-base sm:text-lg">
                {liveMatch.name}
              </div>
              <div className="text-xs text-app-secondary">
                Tap to return directly to the scoring screen and record deliveries.
              </div>
            </div>

            <button className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-sm self-start sm:self-auto flex items-center gap-1.5 flex-shrink-0">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Scoring</span>
            </button>
          </div>
        )}

        {/* Two-Column Area for Recent Matches & Quick Shortcuts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Matches (2 cols on large screen) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-app font-bold text-base sm:text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-app-muted" />
                <span>Recent Matches</span>
              </h2>
              {matches.length > 5 && (
                <button
                  className="text-xs font-semibold text-green-500 hover:underline flex items-center gap-1"
                  onClick={() => navigate('/history')}
                >
                  <span>View All ({matches.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {recentMatches.length === 0 ? (
              <div className="card rounded-2xl p-6">
                <EmptyState
                  title="No matches recorded yet"
                  description="Set up your first friendly or league cricket match in less than 2 minutes."
                  action={
                    <button className="btn-primary mt-2" onClick={() => navigate('/match/setup')}>
                      <PlusCircle className="w-4 h-4" />
                      <span>Start First Match</span>
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentMatches.map(m => (
                  <MatchCard key={m.id} match={m} onClick={() => handleMatchClick(m)} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Management Panel (1 col on large screen) */}
          <div className="space-y-4">
            <h2 className="text-app font-bold text-base sm:text-lg">
              Quick Shortcuts
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <button
                className="card card-hover p-4 rounded-2xl text-left flex items-center gap-3.5 group"
                onClick={() => navigate('/teams')}
              >
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-app font-bold text-sm sm:text-base group-hover:text-blue-500 transition-colors">
                    Manage Teams
                  </div>
                  <div className="text-app-muted text-xs">
                    {teams.length} saved {teams.length === 1 ? 'team' : 'teams'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-app-muted" />
              </button>

              <button
                className="card card-hover p-4 rounded-2xl text-left flex items-center gap-3.5 group"
                onClick={() => navigate('/players')}
              >
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-purple-500 group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-app font-bold text-sm sm:text-base group-hover:text-purple-500 transition-colors">
                    Manage Players
                  </div>
                  <div className="text-app-muted text-xs">
                    {players.length} registered {players.length === 1 ? 'player' : 'players'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-app-muted" />
              </button>

              <button
                className="card card-hover p-4 rounded-2xl text-left flex items-center gap-3.5 group"
                onClick={() => navigate('/statistics')}
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 text-amber-500 group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-app font-bold text-sm sm:text-base group-hover:text-amber-500 transition-colors">
                    Leaderboards & Stats
                  </div>
                  <div className="text-app-muted text-xs">
                    Top run scorers & wicket takers
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-app-muted" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
