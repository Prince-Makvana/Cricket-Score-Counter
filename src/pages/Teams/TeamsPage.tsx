import { useState } from 'react';
import { Plus, Pencil, Trash2, Users, X, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store/useStore';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Modal from '../../components/common/Modal';
import type { Team, Player, PlayerRole } from '../../scoring/types';

const ROLES: PlayerRole[] = ['batter', 'bowler', 'allrounder', 'wicketkeeper'];

const ROLE_BADGES: Record<PlayerRole, string> = {
  batter: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  bowler: 'text-red-500 bg-red-500/10 border-red-500/20',
  allrounder: 'text-green-500 bg-green-500/10 border-green-500/20',
  wicketkeeper: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
};

function PlayerRow({
  player, onEdit, onRemove
}: { player: Player; onEdit: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between py-2 px-1 border-b border-app last:border-0 hover:bg-app-secondary/50 rounded-lg">
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <div className="w-7 h-7 rounded-full bg-green-500/15 flex items-center justify-center text-xs font-black text-green-500 flex-shrink-0">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-app text-sm font-semibold truncate">{player.name}</div>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${ROLE_BADGES[player.role]}`}>
            {player.role}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-app-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
          title="Edit player"
          aria-label={`Edit ${player.name}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
          title="Remove player"
          aria-label={`Remove ${player.name}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function TeamModal({
  isOpen, onClose, initial, onSave
}: { isOpen: boolean; onClose: () => void; initial?: Team; onSave: (team: Team) => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [players, setPlayers] = useState<Player[]>(initial?.players ?? []);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRole, setNewPlayerRole] = useState<PlayerRole>('allrounder');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const p: Player = { id: uuidv4(), name: newPlayerName.trim(), role: newPlayerRole };
    setPlayers(prev => [...prev, p]);
    setNewPlayerName('');
    setError(null);
  };

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const updatePlayer = (updated: Player) => {
    setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingPlayer(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please provide a team name.');
      return;
    }
    if (players.length < 2) {
      setError('Please add at least 2 players to the squad.');
      return;
    }
    const team: Team = {
      id: initial?.id ?? uuidv4(),
      name: name.trim(),
      players,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(team);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Team Squad' : 'Create New Team'} size="md">
      <div className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
            Team Name
          </label>
          <input
            className="input-field"
            placeholder="e.g. Royal Challengers"
            value={name}
            onChange={e => { setName(e.target.value); setError(null); }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-app-muted text-xs font-extrabold uppercase tracking-wider">
              Squad List ({players.length})
            </label>
            <span className="text-[11px] text-app-muted font-medium">Min 2 players</span>
          </div>

          <div className="card rounded-2xl p-2 mb-3 max-h-52 overflow-y-auto border border-app">
            {players.length === 0 ? (
              <div className="text-center py-6 text-app-muted text-xs italic">
                No players added yet. Add players below.
              </div>
            ) : (
              players.map(p => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  onEdit={() => setEditingPlayer(p)}
                  onRemove={() => removePlayer(p.id)}
                />
              ))
            )}
          </div>

          {editingPlayer ? (
            <div className="flex gap-2 items-end p-2.5 rounded-xl bg-app-secondary border border-app">
              <div className="flex-1">
                <label className="block text-[11px] text-app-muted mb-1 font-semibold">Edit Name</label>
                <input
                  className="input-field text-sm"
                  value={editingPlayer.name}
                  onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                />
              </div>
              <div className="w-32">
                <label className="block text-[11px] text-app-muted mb-1 font-semibold">Role</label>
                <select
                  className="input-field text-sm"
                  value={editingPlayer.role}
                  onChange={e => setEditingPlayer({ ...editingPlayer, role: e.target.value as PlayerRole })}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button
                className="btn-primary text-sm px-3 py-2 h-10 flex-shrink-0"
                onClick={() => updatePlayer(editingPlayer)}
                title="Save changes"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="input-field text-sm flex-1"
                placeholder="Player name (e.g. Virat K.)"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPlayer()}
              />
              <div className="flex gap-2">
                <select
                  className="input-field text-sm w-36 capitalize"
                  value={newPlayerRole}
                  onChange={e => setNewPlayerRole(e.target.value as PlayerRole)}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button
                  className="btn-primary text-sm px-4 py-2 h-10 flex-shrink-0 flex items-center gap-1.5"
                  onClick={addPlayer}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2.5 pt-2 border-t border-app">
          <button className="btn-secondary flex-1 justify-center" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary flex-1 justify-center" onClick={handleSave}>
            {initial ? 'Save Squad' : 'Create Team'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function TeamsPage() {
  const { teams, saveTeam, deleteTeam } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-app pb-12">
      <div className="page-container space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-app font-black text-2xl sm:text-3xl">Saved Teams</h1>
            <p className="text-app-secondary text-sm">
              Manage your local club and friendly squads for quick match setup.
            </p>
          </div>
          <button
            className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-sm"
            onClick={() => { setEditTeam(undefined); setShowModal(true); }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>

        {/* List */}
        {teams.length === 0 ? (
          <div className="card rounded-2xl p-8">
            <EmptyState
              icon={<Users className="w-10 h-10 text-blue-500" />}
              title="No teams saved yet"
              description="Save your recurring squads so you won't have to retype player names for every match."
              action={
                <button
                  className="btn-primary mt-2"
                  onClick={() => { setEditTeam(undefined); setShowModal(true); }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Team</span>
                </button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map(team => (
              <div
                key={team.id}
                className="card p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xs transition-all hover:border-green-500/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-app font-black text-base sm:text-lg truncate">
                        {team.name}
                      </div>
                      <div className="text-app-muted text-xs font-medium">
                        {team.players.length} players registered
                      </div>
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditTeam(team); setShowModal(true); }}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-app-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        title="Edit squad"
                        aria-label={`Edit ${team.name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(team.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete team"
                        aria-label={`Delete ${team.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {team.players.map(p => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 rounded-lg bg-app-secondary border border-app text-app text-xs font-medium truncate max-w-[140px]"
                        title={`${p.name} (${p.role})`}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-app flex items-center justify-between text-[11px] text-app-muted">
                  <span>Updated {new Date(team.updatedAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => { setEditTeam(team); setShowModal(true); }}
                    className="text-green-500 font-semibold hover:underline"
                  >
                    Edit Squad →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <TeamModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          initial={editTeam}
          onSave={saveTeam}
        />

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => { if (deleteId) deleteTeam(deleteId); }}
          title="Delete Team?"
          message="Are you sure you want to delete this team? Past matches recorded with this team will not be affected."
          confirmLabel="Delete Team"
          danger
        />

      </div>
    </div>
  );
}
