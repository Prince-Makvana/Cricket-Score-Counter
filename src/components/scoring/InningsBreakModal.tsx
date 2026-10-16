import { useState } from 'react';
import Modal from '../common/Modal';
import type { InningsState, MatchState } from '../../scoring/types';
import { calculateTarget } from '../../scoring/inningsCalculator';

interface InningsBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInnings: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
  match: MatchState;
  completedInnings: InningsState;
}

export default function InningsBreakModal({
  isOpen, onClose, onStartInnings, match, completedInnings
}: InningsBreakModalProps) {
  const chaseTeamId = completedInnings.bowlingTeamId;
  const bowlingTeamId = completedInnings.battingTeamId;
  const chaseTeam = match.teams[chaseTeamId];
  const bowlingTeam = match.teams[bowlingTeamId];

  const [strikerId, setStrikerId] = useState(chaseTeam?.players[0]?.id ?? '');
  const [nonStrikerId, setNonStrikerId] = useState(chaseTeam?.players[1]?.id ?? '');
  const [bowlerId, setBowlerId] = useState(bowlingTeam?.players[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  const target = calculateTarget(completedInnings.totalRuns);

  const handleStart = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      setError('Please select both opening batters and the opening bowler.');
      return;
    }
    if (strikerId === nonStrikerId) {
      setError('Opening striker and non-striker must be two different players.');
      return;
    }
    setError(null);
    onStartInnings(strikerId, nonStrikerId, bowlerId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Innings Break" size="md" closeable={false}>
      <div className="space-y-4">
        {/* Result summary banner */}
        <div
          className="p-4 rounded-2xl text-center text-white shadow-md relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0f4c1e,#0d2e10)' }}
        >
          <div className="text-green-300 text-xs font-semibold uppercase tracking-wider mb-1">
            {match.teams[completedInnings.battingTeamId]?.name} Innings Complete
          </div>
          <div className="text-white font-black text-3xl sm:text-4xl tabular-nums">
            {completedInnings.totalRuns}
            <span className="text-2xl text-green-200/80">/{completedInnings.wickets}</span>
          </div>
          <div className="text-amber-400 font-bold text-sm mt-2">
            {chaseTeam?.name} require <strong>{target}</strong> runs to win
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Opening selectors */}
        <div className="space-y-3">
          <div>
            <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
              Opening Striker ({chaseTeam?.name})
            </label>
            <select
              className="input-field text-sm"
              value={strikerId}
              onChange={e => { setStrikerId(e.target.value); setError(null); }}
            >
              {chaseTeam?.players.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
              Opening Non-Striker ({chaseTeam?.name})
            </label>
            <select
              className="input-field text-sm"
              value={nonStrikerId}
              onChange={e => { setNonStrikerId(e.target.value); setError(null); }}
            >
              {chaseTeam?.players.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
              Opening Bowler ({bowlingTeam?.name})
            </label>
            <select
              className="input-field text-sm"
              value={bowlerId}
              onChange={e => { setBowlerId(e.target.value); setError(null); }}
            >
              {bowlingTeam?.players.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="btn-primary w-full justify-center text-sm sm:text-base py-3 font-bold shadow-md"
          onClick={handleStart}
        >
          Commence 2nd Innings
        </button>
      </div>
    </Modal>
  );
}
