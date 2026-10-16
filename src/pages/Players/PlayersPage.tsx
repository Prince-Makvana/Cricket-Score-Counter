import { useState } from 'react';
import { Plus, Pencil, Trash2, User, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import type { Player, PlayerRole } from '../../scoring/types';

const ROLES: PlayerRole[] = ['batter', 'bowler', 'allrounder', 'wicketkeeper'];

const ROLE_BADGES: Record<PlayerRole, string> = {
  batter: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  bowler: 'text-red-500 bg-red-500/10 border-red-500/20',
  allrounder: 'text-green-500 bg-green-500/10 border-green-500/20',
  wicketkeeper: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
};

function PlayerModal({
  isOpen, onClose, initial, onSave
}: { isOpen: boolean; onClose: () => void; initial?: Player; onSave: (p: Player) => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState<PlayerRole>(initial?.role ?? 'allrounder');
  const [jersey, setJersey] = useState(initial?.jerseyNumber?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a player name.');
      return;
    }
    onSave({
      id: initial?.id ?? uuidv4(),
      name: name.trim(),
      role,
      jerseyNumber: jersey ? parseInt(jersey, 10) : undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Player Details' : 'Register New Player'} size="sm">
      <div className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
            Player Name
          </label>
          <input
            className="input-field"
            placeholder="e.g. Jasprit Bumrah"
            value={name}
            onChange={e => { setName(e.target.value); setError(null); }}
          />
        </div>

        <div>
          <label className="block text-app-muted text-xs mb-1.5 font-extrabold uppercase tracking-wider">
            Playing Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition-all ${
                  role === r
                    ? 'border-green-500 bg-green-500/15 text-green-500 shadow-xs'
                    : 'border-app text-app-secondary hover:border-green-500/30'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
            Jersey # (Optional)
          </label>
          <input
            className="input-field"
            placeholder="e.g. 93"
            type="number"
            min={1}
            max={999}
            value={jersey}
            onChange={e => setJersey(e.target.value)}
          />
        </div>

        <div className="flex gap-2.5 pt-2 border-t border-app">
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary flex-1 justify-center" onClick={handleSave}>
            {initial ? 'Save Player' : 'Register'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function PlayersPage() {
  const { players, savePlayer, deletePlayer } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'all'>('all');

  const filtered = players
    .filter(p => roleFilter === 'all' || p.role === roleFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-app pb-12">
      <div className="page-container space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-app font-black text-2xl sm:text-3xl">Player Directory</h1>
            <p className="text-app-secondary text-sm">
              Keep a roster of players, roles, and jersey numbers across your weekend tournaments.
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-sm"
            onClick={() => { setEditPlayer(undefined); setShowModal(true); }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>

        {/* Search & Filter Strip */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
            <input
              className="input-field pl-10 text-sm"
              placeholder="Search registered players by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search players"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['all', ...ROLES] as const).map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border capitalize transition-all whitespace-nowrap ${
                  roleFilter === r
                    ? 'bg-green-600 border-green-600 text-white shadow-xs'
                    : 'border-app text-app-secondary hover:border-green-500/50 bg-app-secondary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Players Grid */}
        {filtered.length === 0 ? (
          <div className="card rounded-2xl p-8">
            <EmptyState
              icon={<User className="w-10 h-10 text-purple-500" />}
              title={players.length === 0 ? "No players registered" : "No players match your search"}
              description={players.length === 0 ? "Add your regular teammates so you can quickly build match rosters." : "Try adjusting your search query or role filter."}
              action={
                players.length === 0 ? (
                  <button
                    className="btn-primary mt-2"
                    onClick={() => { setEditPlayer(undefined); setShowModal(true); }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register First Player</span>
                  </button>
                ) : (
                  <button className="btn-secondary mt-2" onClick={() => { setSearch(''); setRoleFilter('all'); }}>
                    Clear Filter
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(p => (
              <div
                key={p.id}
                className="card p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-green-500/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 pr-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${ROLE_BADGES[p.role]}`}>
                    {p.jerseyNumber ? `#${p.jerseyNumber}` : p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-app font-black text-sm sm:text-base truncate">
                      {p.name}
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${ROLE_BADGES[p.role]}`}>
                      {p.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditPlayer(p); setShowModal(true); }}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-app-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                    title="Edit player"
                    aria-label={`Edit ${p.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete player"
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <PlayerModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          initial={editPlayer}
          onSave={savePlayer}
        />

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => { if (deleteId) deletePlayer(deleteId); }}
          title="Delete Player?"
          message="Are you sure you want to delete this player from the directory? Past match scorecards will not be affected."
          confirmLabel="Delete Player"
          danger
        />

      </div>
    </div>
  );
}
