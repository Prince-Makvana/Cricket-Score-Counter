import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Search, Trophy, Play, PlusCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import type { MatchState } from '../../scoring/types';

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'completed', label: 'Completed' },
  { id: 'paused', label: 'Paused' },
  { id: 'abandoned', label: 'Abandoned' },
] as const;

function MatchRow({ match, onOpen, onResume, onDelete }: {
  match: MatchState;
  onOpen: () => void;
  onResume?: () => void;
  onDelete: () => void;
}) {
  const team1 = match.teams[match.team1Id];
  const team2 = match.teams[match.team2Id];
  const inn1 = match.innings[0];
  const inn2 = match.innings[1];

  const isLive = match.status === 'live' || match.status === 'paused';

  const statusColor =
    match.status === 'live' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
    match.status === 'completed' ? 'text-green-500 bg-green-500/10 border-green-500/20' :
    match.status === 'paused' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' :
    'text-app-muted bg-app-secondary border-app';

  return (
    <div className="card p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-green-500/40">
      <button onClick={onOpen} className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
            {match.status}
          </span>
          <span className="text-app-muted text-xs font-medium">{match.date}</span>
          <span className="text-app-muted text-xs">·</span>
          <span className="text-app-muted text-xs font-semibold">{match.format}</span>
          {match.venue && (
            <>
              <span className="text-app-muted text-xs">·</span>
              <span className="text-app-muted text-xs truncate max-w-[150px]">{match.venue}</span>
            </>
          )}
        </div>

        <div className="text-app font-black text-base sm:text-lg mb-2 truncate">
          {match.name}
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="min-w-0">
            <span className="text-app-secondary font-medium">{team1?.name} </span>
            {inn1 && <span className="text-app font-black tabular-nums">({inn1.totalRuns}/{inn1.wickets})</span>}
          </div>
          <span className="text-app-muted text-xs font-bold uppercase">vs</span>
          <div className="min-w-0">
            <span className="text-app-secondary font-medium">{team2?.name} </span>
            {inn2 ? (
              <span className="text-app font-black tabular-nums">({inn2.totalRuns}/{inn2.wickets})</span>
            ) : (
              <span className="text-app-muted text-xs italic">yet to bat</span>
            )}
          </div>
        </div>

        {match.result && (
          <div className="mt-2 text-xs text-green-500 font-semibold flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{match.result.description}</span>
          </div>
        )}
      </button>

      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
        {isLive && onResume && (
          <button
            onClick={onResume}
            className="btn-primary text-xs py-1.5 px-3 h-8 flex items-center gap-1.5"
            title="Resume scoring"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Resume</span>
          </button>
        )}

        <button
          onClick={onOpen}
          className="btn-secondary text-xs py-1.5 px-3 h-8"
        >
          Scorecard
        </button>

        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
          title="Delete match"
          aria-label="Delete match"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { matches, loadMatch, deleteMatch } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = matches
    .filter(m => statusFilter === 'all' || m.status === statusFilter)
    .filter(m =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.teams[m.team1Id]?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.teams[m.team2Id]?.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const handleOpen = (match: MatchState) => {
    loadMatch(match.id);
    navigate('/scorecard');
  };

  const handleResume = (match: MatchState) => {
    loadMatch(match.id);
    navigate('/live');
  };

  return (
    <div className="min-h-screen bg-app pb-12">
      <div className="page-container space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-app font-black text-2xl sm:text-3xl">Match History</h1>
            <p className="text-app-secondary text-sm">
              Review completed scorecards or resume in-progress matches.
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2 self-start sm:self-auto"
            onClick={() => navigate('/match/setup')}
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Match</span>
          </button>
        </div>

        {/* Search & Filter Strip */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
            <input
              className="input-field pl-10 text-sm"
              placeholder="Search by match title or team name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search matches"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-green-600 border-green-600 text-white shadow-xs'
                    : 'border-app text-app-secondary hover:border-green-500/50 bg-app-secondary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matches List */}
        {filtered.length === 0 ? (
          <div className="card rounded-2xl p-8">
            <EmptyState
              icon={<Trophy className="w-10 h-10 text-amber-500" />}
              title={matches.length === 0 ? "No matches recorded" : "No matches match your filter"}
              description={matches.length === 0 ? "Set up your first match to start tracking overs, runs, and wickets." : "Try clearing your search query or selecting a different status filter."}
              action={
                matches.length === 0 ? (
                  <button className="btn-primary mt-2" onClick={() => navigate('/match/setup')}>
                    <PlusCircle className="w-4 h-4" />
                    <span>Start First Match</span>
                  </button>
                ) : (
                  <button className="btn-secondary mt-2" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                    Clear Filters
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => (
              <MatchRow
                key={m.id}
                match={m}
                onOpen={() => handleOpen(m)}
                onResume={m.status === 'live' || m.status === 'paused' ? () => handleResume(m) : undefined}
                onDelete={() => setDeleteId(m.id)}
              />
            ))}
          </div>
        )}

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => { if (deleteId) deleteMatch(deleteId); }}
          title="Delete Match Record?"
          message="This action will permanently delete this match and its entire ball-by-ball delivery log from local storage. This cannot be undone."
          confirmLabel="Delete Match"
          danger
        />

      </div>
    </div>
  );
}
