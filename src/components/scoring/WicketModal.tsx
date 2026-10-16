import { useState } from 'react';
import Modal from '../common/Modal';
import type { DismissalType, WicketInfo, InningsState, MatchState } from '../../scoring/types';

const DISMISSAL_TYPES: { value: DismissalType; label: string; needsBowler: boolean; needsFielder: boolean }[] = [
  { value: 'bowled', label: 'Bowled', needsBowler: true, needsFielder: false },
  { value: 'caught', label: 'Caught', needsBowler: true, needsFielder: true },
  { value: 'caught_and_bowled', label: 'Caught & Bowled', needsBowler: true, needsFielder: false },
  { value: 'lbw', label: 'LBW', needsBowler: true, needsFielder: false },
  { value: 'stumped', label: 'Stumped', needsBowler: true, needsFielder: true },
  { value: 'run_out', label: 'Run Out', needsBowler: false, needsFielder: true },
  { value: 'hit_wicket', label: 'Hit Wicket', needsBowler: true, needsFielder: false },
  { value: 'retired_hurt', label: 'Retired Hurt', needsBowler: false, needsFielder: false },
  { value: 'retired_out', label: 'Retired Out', needsBowler: false, needsFielder: false },
  { value: 'obstructing_field', label: 'Obstructing Field', needsBowler: false, needsFielder: false },
  { value: 'hit_ball_twice', label: 'Hit Ball Twice', needsBowler: false, needsFielder: false },
  { value: 'timed_out', label: 'Timed Out', needsBowler: false, needsFielder: false },
];

interface WicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (wicket: WicketInfo, runs: number) => void;
  innings: InningsState;
  match: MatchState;
  isNoBall?: boolean;
  isWide?: boolean;
}

export default function WicketModal({
  isOpen, onClose, onConfirm, innings, match, isNoBall, isWide
}: WicketModalProps) {
  const [dismissalType, setDismissalType] = useState<DismissalType>('bowled');
  const [dismissedBatterId, setDismissedBatterId] = useState(innings.strikerId);
  const [fielder1Id, setFielder1Id] = useState('');
  const [replacementBatterId, setReplacementBatterId] = useState('');
  const [runs, setRuns] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const bowlingTeam = match.teams[innings.bowlingTeamId];
  const battingTeam = match.teams[innings.battingTeamId];
  const activeBatters = [innings.strikerId, innings.nonStrikerId];
  const dt = DISMISSAL_TYPES.find(d => d.value === dismissalType)!;

  // Certain dismissals not allowed on wides
  const availableTypes = DISMISSAL_TYPES.filter(d => {
    if (isWide && ['bowled', 'caught', 'caught_and_bowled', 'lbw', 'hit_wicket', 'stumped'].includes(d.value)) return false;
    return true;
  });

  // Find not-yet-out batters for replacement
  const usedBatters = new Set([
    ...activeBatters,
    ...innings.fallOfWickets.map(f => f.batterId),
    ...innings.retiredHurtBatters,
  ]);
  const availableReplacements = battingTeam?.players.filter(p => !usedBatters.has(p.id)) ?? [];

  const handleConfirm = () => {
    if (!replacementBatterId && availableReplacements.length > 0 && dismissalType !== 'retired_hurt') {
      setValidationError('Please select the incoming replacement batter.');
      return;
    }

    const wicket: WicketInfo = {
      dismissalType,
      dismissedBatterId,
      fielder1Id: dt.needsFielder && fielder1Id ? fielder1Id : undefined,
      isRetiredHurt: dismissalType === 'retired_hurt',
      replacementBatterId: availableReplacements.length > 0 ? replacementBatterId : undefined,
    };

    onConfirm(wicket, runs);
    onClose();

    // Reset state
    setDismissalType('bowled');
    setFielder1Id('');
    setReplacementBatterId('');
    setRuns(0);
    setValidationError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Dismissal" size="md">
      <div className="space-y-4">
        {validationError && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
            {validationError}
          </div>
        )}

        {/* Dismissed Batter */}
        <div>
          <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
            Dismissed Batter
          </label>
          <div className="grid grid-cols-2 gap-2">
            {activeBatters.map(id => {
              const b = innings.batterStats[id];
              if (!b) return null;
              const isSelected = dismissedBatterId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDismissedBatterId(id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-red-500 bg-red-500/10 text-red-500 font-bold shadow-xs'
                      : 'border-app text-app-secondary hover:border-red-500/30 bg-app-secondary'
                  }`}
                >
                  <div className="text-sm truncate">
                    {b.name} {id === innings.strikerId && <span className="text-xs font-bold text-amber-500">*</span>}
                  </div>
                  <div className="text-xs text-app-muted">{b.runs} runs ({b.balls}b)</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dismissal Type */}
        <div>
          <label className="block text-app-muted text-xs mb-1.5 font-extrabold uppercase tracking-wider">
            Method of Dismissal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-0.5">
            {availableTypes.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => { setDismissalType(d.value); setValidationError(null); }}
                className={`p-2 rounded-xl border text-xs font-semibold transition-all text-left ${
                  dismissalType === d.value
                    ? 'border-red-500 bg-red-500/15 text-red-500 font-bold'
                    : 'border-app text-app-secondary hover:border-red-500/40 bg-app-secondary'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fielder Selection (if applicable) */}
        {dt.needsFielder && (
          <div>
            <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
              {dismissalType === 'run_out' ? 'Run Out by Fielder' : dismissalType === 'stumped' ? 'Wicketkeeper' : 'Catch Taken by'}
            </label>
            <select
              className="input-field text-sm"
              value={fielder1Id}
              onChange={e => setFielder1Id(e.target.value)}
            >
              <option value="">— Select fielder (optional) —</option>
              {bowlingTeam?.players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Runs completed before dismissal */}
        {(dismissalType === 'run_out' || isNoBall) && (
          <div>
            <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
              Runs Completed Before Dismissal
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRuns(r)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-black transition-all ${
                    runs === r
                      ? 'border-green-500 bg-green-500/10 text-green-500 shadow-xs'
                      : 'border-app text-app-secondary bg-app-secondary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next Incoming Batter */}
        {availableReplacements.length > 0 && dismissalType !== 'retired_hurt' && (
          <div>
            <label className="block text-app-muted text-xs mb-1 font-extrabold uppercase tracking-wider">
              Next Batter
            </label>
            <select
              className="input-field text-sm"
              value={replacementBatterId}
              onChange={e => { setReplacementBatterId(e.target.value); setValidationError(null); }}
            >
              <option value="">— Select incoming batter —</option>
              {availableReplacements.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
          </div>
        )}

        {availableReplacements.length === 0 && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
            All batters in the squad have batted. Innings will conclude after this wicket.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-app">
          <button
            type="button"
            className="btn-secondary flex-1 justify-center py-2.5"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger flex-1 justify-center py-2.5 font-bold shadow-md"
            onClick={handleConfirm}
          >
            Confirm Out
          </button>
        </div>
      </div>
    </Modal>
  );
}
