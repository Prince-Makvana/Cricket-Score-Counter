import Modal from '../common/Modal';
import { Trophy, FileText, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MatchState } from '../../scoring/types';

interface MatchCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchState;
}

export default function MatchCompleteModal({ isOpen, onClose, match }: MatchCompleteModalProps) {
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Match Complete" size="md" closeable={false}>
      <div className="text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto">
          <Trophy className="w-10 h-10 text-yellow-400" />
        </div>

        {match.result && (
          <>
            {match.result.winnerName && (
              <div>
                <div className="text-green-400 text-sm font-semibold uppercase tracking-widest mb-1">Winner</div>
                <div className="text-app font-black text-2xl">{match.result.winnerName}</div>
              </div>
            )}
            <div className="p-3 rounded-xl bg-app-secondary text-app text-sm">
              {match.result.description}
            </div>
          </>
        )}

        <div className="flex flex-col gap-2">
          <button
            className="btn-primary justify-center"
            onClick={() => { onClose(); navigate('/scorecard'); }}
          >
            <FileText className="w-4 h-4" />
            Full Scorecard
          </button>
          <button
            className="btn-secondary justify-center"
            onClick={() => { onClose(); navigate('/statistics'); }}
          >
            <BarChart2 className="w-4 h-4" />
            Statistics
          </button>
          <button
            className="btn-secondary justify-center"
            onClick={() => { onClose(); navigate('/dashboard'); }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </Modal>
  );
}
