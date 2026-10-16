import { useState } from 'react';
import Modal from '../common/Modal';
import type { InningsState, MatchState } from '../../scoring/types';
import { isBowlerEligible } from '../../scoring/overCalculator';

interface EndOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBowler: (bowlerId: string) => void;
  innings: InningsState;
  match: MatchState;
}

export default function EndOverModal({ isOpen, onClose, onSelectBowler, innings, match }: EndOverModalProps) {
  const [selected, setSelected] = useState('');

  const bowlingTeam = match.teams[innings.bowlingTeamId];
  const lastOverBowlerId = innings.overHistory[innings.overHistory.length - 1]?.bowlerId;
  const maxOvers = match.rules.maxOversPerBowler;

  const eligibleBowlers = bowlingTeam?.players.filter(p =>
    isBowlerEligible(p.id, innings, maxOvers, lastOverBowlerId)
  ) ?? [];

  const handleConfirm = () => {
    if (!selected) return;
    onSelectBowler(selected);
    setSelected('');
  };

  const lastOverSummary = innings.overHistory[innings.overHistory.length - 1];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`End of Over ${innings.overHistory.length}`} size="sm" closeable={false}>
      <div className="space-y-4">
        {lastOverSummary && (
          <div className="p-3 rounded-xl bg-app-secondary">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-app-muted">Bowler</span>
              <span className="text-app font-semibold">{lastOverSummary.bowlerName}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-app-muted">This over</span>
              <span className="text-app font-semibold">
                {lastOverSummary.runs} runs, {lastOverSummary.wickets} wkt{lastOverSummary.wickets !== 1 ? 's' : ''}
                {lastOverSummary.isMaiden ? ' · Maiden' : ''}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {lastOverSummary.balls.map((b, i) => {
                const isWicket = b.includes('W');
                const isFour = b === '4';
                const isSix = b === '6';
                const isExtra = b.includes('wd') || b.includes('nb');
                return (
                  <div key={i} className={`over-ball text-xs ${
                    isWicket ? 'bg-red-500/20 text-red-400 border-red-400' :
                    isFour ? 'bg-blue-500/20 text-blue-400 border-blue-400' :
                    isSix ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400' :
                    isExtra ? 'bg-purple-500/20 text-purple-400 border-purple-400' :
                    'text-gray-400 border-gray-600'
                  }`}>{b}</div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-app-muted text-xs mb-2 font-semibold uppercase">Select Next Bowler</label>
          {eligibleBowlers.length === 0 && (
            <p className="text-app-muted text-sm">No eligible bowlers available.</p>
          )}
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {eligibleBowlers.map(p => {
              const stats = innings.bowlerStats[p.id];
              const oversB = stats ? Math.floor(stats.legalBalls / 6) : 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    selected === p.id
                      ? 'border-green-500 bg-green-500/10 text-green-400'
                      : 'border-app text-app hover:border-green-500/40'
                  }`}
                >
                  <span className="font-semibold text-sm">{p.name}</span>
                  <span className="text-app-muted text-xs">{oversB}/{maxOvers} overs</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="btn-primary w-full justify-center"
          onClick={handleConfirm}
          disabled={!selected}
        >
          Start Next Over
        </button>
      </div>
    </Modal>
  );
}
