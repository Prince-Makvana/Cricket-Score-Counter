// ============================================================
// Match Setup – 4-Step Wizard
// ============================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  ChevronRight, ChevronLeft, Trophy, Users, Settings, CheckCircle,
  Plus, Trash2
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Team, Player, PlayerRole, MatchFormat } from '../../scoring/types';

const FORMATS: { label: string; value: MatchFormat; overs: number }[] = [
  { label: 'T20', value: 'T20', overs: 20 },
  { label: 'ODI', value: 'ODI', overs: 50 },
  { label: 'T10', value: 'T10', overs: 10 },
  { label: 'The Hundred', value: 'The Hundred', overs: 17 },
  { label: 'Custom', value: 'Custom', overs: 10 },
];

const ROLE_OPTIONS: { value: PlayerRole; label: string }[] = [
  { value: 'batter', label: '🏏 Batter' },
  { value: 'bowler', label: '⚽ Bowler' },
  { value: 'allrounder', label: '⭐ All-Rounder' },
  { value: 'wicketkeeper', label: '🧤 Keeper' },
];

function makePlayer(name: string): Player {
  return { id: uuidv4(), name: name.trim(), role: 'allrounder' };
}

function makeTeam(name: string, count: number): Team {
  return {
    id: uuidv4(),
    name: name || 'Team',
    players: Array.from({ length: count }, (_, i) => makePlayer(`Player ${i + 1}`)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Step 1: Match Details ────────────────────────────────────

function Step1({ draft, update, onNext }: { draft: any; update: (p: any) => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-app text-sm font-semibold mb-1.5">Match Name</label>
        <input
          className="input-field"
          placeholder="e.g. Weekend Friendlies – Game 3"
          value={draft.name}
          onChange={e => update({ name: e.target.value })}
          id="match-name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-app text-sm font-semibold mb-1.5">Date</label>
          <input
            type="date"
            className="input-field"
            value={draft.date}
            onChange={e => update({ date: e.target.value })}
            id="match-date"
          />
        </div>
        <div>
          <label className="block text-app text-sm font-semibold mb-1.5">Venue (optional)</label>
          <input
            className="input-field"
            placeholder="Ground name"
            value={draft.venue}
            onChange={e => update({ venue: e.target.value })}
            id="match-venue"
          />
        </div>
      </div>

      <div>
        <label className="block text-app text-sm font-semibold mb-2">Match Format</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FORMATS.map(f => (
            <button
              key={f.value}
              onClick={() => update({ format: f.value, oversPerInnings: f.overs })}
              className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                draft.format === f.value
                  ? 'border-green-500 bg-green-500/10 text-green-500'
                  : 'border-app text-app-secondary hover:border-green-500/50'
              }`}
              id={`format-${f.value.toLowerCase().replace(/\s+/g,'-')}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-app text-sm font-semibold mb-1.5">Overs per Innings</label>
          <input
            type="number"
            min={1}
            max={100}
            className="input-field"
            value={draft.oversPerInnings}
            onChange={e => update({ oversPerInnings: Number(e.target.value) })}
            id="match-overs"
          />
        </div>
        <div>
          <label className="block text-app text-sm font-semibold mb-1.5">Players per Team</label>
          <input
            type="number"
            min={2}
            max={15}
            className="input-field"
            value={draft.playersPerTeam}
            onChange={e => update({ playersPerTeam: Number(e.target.value) })}
            id="match-players"
          />
        </div>
      </div>

      <button className="btn-primary w-full justify-center py-3" onClick={onNext} id="step1-next">
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Team Player Editor ───────────────────────────────────────

function TeamEditor({
  team, onChange, title, playersPerTeam
}: { team: Team; onChange: (t: Team) => void; title: string; playersPerTeam: number }) {
  const updatePlayer = (idx: number, partial: Partial<Player>) => {
    const players = [...team.players];
    players[idx] = { ...players[idx], ...partial };
    onChange({ ...team, players });
  };

  const addPlayer = () => {
    if (team.players.length >= playersPerTeam) return;
    onChange({ ...team, players: [...team.players, makePlayer(`Player ${team.players.length + 1}`)] });
  };

  const removePlayer = (idx: number) => {
    if (team.players.length <= 2) return;
    onChange({ ...team, players: team.players.filter((_, i) => i !== idx) });
  };

  // Ensure the right number of players
  useEffect(() => {
    if (team.players.length < playersPerTeam) {
      const extra = Array.from({ length: playersPerTeam - team.players.length }, (_, i) =>
        makePlayer(`Player ${team.players.length + i + 1}`)
      );
      onChange({ ...team, players: [...team.players, ...extra] });
    }
  }, [playersPerTeam]);

  return (
    <div className="card rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
          <Users className="w-4 h-4 text-green-500" />
        </div>
        <div className="flex-1">
          <label className="block text-app-muted text-xs font-semibold uppercase tracking-wider mb-0.5">{title}</label>
          <input
            className="input-field py-1.5 text-sm font-bold"
            value={team.name}
            onChange={e => onChange({ ...team, name: e.target.value })}
            placeholder="Team name"
            id={`team-${title.toLowerCase().replace(/\s+/g,'-')}-name`}
          />
        </div>
      </div>

      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
        {team.players.map((p, idx) => (
          <div key={p.id} className="flex items-center gap-2 min-w-0">
            {/* Jersey number */}
            <div className="w-6 h-6 rounded-full bg-app-secondary flex items-center justify-center text-xs text-app-muted font-bold flex-shrink-0">
              {idx + 1}
            </div>

            {/* Name input — takes remaining space */}
            <input
              className="input-field py-2 text-sm min-w-0 flex-1"
              value={p.name}
              onChange={e => updatePlayer(idx, { name: e.target.value })}
              placeholder={`Player ${idx + 1}`}
              id={`team-${title.toLowerCase().replace(/\s+/g,'-')}-player-${idx}`}
            />

            {/* Role dropdown — fixed compact width */}
            <select
              className="input-field py-2 text-xs flex-shrink-0"
              style={{ width: '7.5rem' }}
              value={p.role}
              onChange={e => updatePlayer(idx, { role: e.target.value as PlayerRole })}
              id={`team-${title.toLowerCase().replace(/\s+/g,'-')}-role-${idx}`}
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Remove button */}
            <button
              onClick={() => removePlayer(idx)}
              className="p-1.5 text-app-muted hover:text-red-500 transition-colors flex-shrink-0 disabled:opacity-30"
              disabled={team.players.length <= 2}
              title="Remove player"
              id={`remove-player-${title.toLowerCase()}-${idx}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {team.players.length < playersPerTeam && (
        <button
          onClick={addPlayer}
          className="mt-3 flex items-center gap-1.5 text-green-500 text-sm font-medium hover:text-green-400 transition-colors"
          id={`add-player-${title.toLowerCase().replace(/\s+/g,'-')}`}
        >
          <Plus className="w-4 h-4" /> Add Player
        </button>
      )}
    </div>
  );
}

// ─── Step 2: Teams & Players ──────────────────────────────────

function Step2({ draft, update, onNext, onBack }: { draft: any; update: (p: any) => void; onNext: () => void; onBack: () => void }) {
  const team1 = draft.team1 as Team || makeTeam('Team 1', draft.playersPerTeam);
  const team2 = draft.team2 as Team || makeTeam('Team 2', draft.playersPerTeam);

  if (!draft.team1) update({ team1 });
  if (!draft.team2) update({ team2 });

  // Determine batting team based on toss
  const battingTeamId = draft.toss
    ? draft.toss.decision === 'bat' ? draft.toss.winnerTeamId : (draft.toss.winnerTeamId === team1.id ? team2.id : team1.id)
    : team1.id;
  const battingTeam = battingTeamId === team1.id ? team1 : team2;
  const bowlingTeam = battingTeamId === team1.id ? team2 : team1;

  return (
    <div className="space-y-4">
      <TeamEditor team={team1} onChange={t => update({ team1: t })} title="Team 1" playersPerTeam={draft.playersPerTeam} />
      <TeamEditor team={team2} onChange={t => update({ team2: t })} title="Team 2" playersPerTeam={draft.playersPerTeam} />

      {/* Opening selections */}
      <div className="card rounded-xl p-4">
        <h3 className="text-app font-semibold mb-3 text-sm">Opening Selections</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-app-muted text-xs mb-1">Opening Batter (Striker)</label>
            <select
              className="input-field text-sm"
              value={draft.openingBatter1Id || battingTeam.players[0]?.id || ''}
              onChange={e => update({ openingBatter1Id: e.target.value })}
              id="opening-striker"
            >
              {battingTeam.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-app-muted text-xs mb-1">Opening Batter (Non-Striker)</label>
            <select
              className="input-field text-sm"
              value={draft.openingBatter2Id || battingTeam.players[1]?.id || ''}
              onChange={e => update({ openingBatter2Id: e.target.value })}
              id="opening-non-striker"
            >
              {battingTeam.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-app-muted text-xs mb-1">Opening Bowler</label>
            <select
              className="input-field text-sm"
              value={draft.openingBowlerId || bowlingTeam.players[0]?.id || ''}
              onChange={e => update({ openingBowlerId: e.target.value })}
              id="opening-bowler"
            >
              {bowlingTeam.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary flex-1 justify-center py-3" onClick={onBack} id="step2-back">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button className="btn-primary flex-1 justify-center py-3" onClick={onNext} id="step2-next">
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Toss & Rules ─────────────────────────────────────

function Step3({ draft, update, onNext, onBack }: { draft: any; update: (p: any) => void; onNext: () => void; onBack: () => void }) {
  const team1 = draft.team1 as Team;
  const team2 = draft.team2 as Team;
  const rules = draft.rules || {};

  const setRule = (k: string, v: any) => update({ rules: { ...rules, [k]: v } });

  return (
    <div className="space-y-5">
      {/* Toss */}
      <div className="card rounded-xl p-4">
        <h3 className="text-app font-semibold mb-3">Toss Result</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[team1, team2].map(team => (
            <button
              key={team?.id}
              onClick={() => update({ toss: { ...(draft.toss || {}), winnerTeamId: team?.id } })}
              className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                draft.toss?.winnerTeamId === team?.id
                  ? 'border-gold-500 bg-yellow-500/10 text-yellow-500'
                  : 'border-app text-app-secondary hover:border-yellow-500/50'
              }`}
              id={`toss-winner-${team?.id}`}
            >
              {team?.name || 'Team'}
            </button>
          ))}
        </div>
        {draft.toss?.winnerTeamId && (
          <div className="grid grid-cols-2 gap-2">
            {(['bat', 'bowl'] as const).map(decision => (
              <button
                key={decision}
                onClick={() => update({ toss: { ...draft.toss, decision } })}
                className={`p-2.5 rounded-xl border-2 text-sm font-semibold transition-all capitalize ${
                  draft.toss?.decision === decision
                    ? 'border-green-500 bg-green-500/10 text-green-500'
                    : 'border-app text-app-secondary hover:border-green-500/50'
                }`}
                id={`toss-decision-${decision}`}
              >
                Elected to {decision}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="card rounded-xl p-4 space-y-4">
        <h3 className="text-app font-semibold">Match Rules</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-app-muted text-xs mb-1">Max Overs per Bowler</label>
            <input
              type="number" min={1} max={draft.oversPerInnings}
              className="input-field text-sm"
              value={rules.maxOversPerBowler ?? Math.ceil(draft.oversPerInnings / 5)}
              onChange={e => setRule('maxOversPerBowler', Number(e.target.value))}
              id="rule-max-overs"
            />
          </div>
          <div>
            <label className="block text-app-muted text-xs mb-1">Wide Penalty (runs)</label>
            <input
              type="number" min={1} max={5}
              className="input-field text-sm"
              value={rules.widePenalty ?? 1}
              onChange={e => setRule('widePenalty', Number(e.target.value))}
              id="rule-wide-penalty"
            />
          </div>
          <div>
            <label className="block text-app-muted text-xs mb-1">No-Ball Penalty (runs)</label>
            <input
              type="number" min={1} max={5}
              className="input-field text-sm"
              value={rules.noBallPenalty ?? 1}
              onChange={e => setRule('noBallPenalty', Number(e.target.value))}
              id="rule-noball-penalty"
            />
          </div>
        </div>

        <div className="space-y-3">
          {[
            { key: 'freeHitEnabled', label: 'Free Hit after No-Ball', id: 'rule-freehit' },
            { key: 'powerplayEnabled', label: 'Enable Powerplay Rules', id: 'rule-powerplay' },
            { key: 'superOverEnabled', label: 'Super Over (if Tied)', id: 'rule-superover' },
          ].map(({ key, label, id }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer" htmlFor={id}>
              <input
                id={id}
                type="checkbox"
                className="w-4 h-4 accent-green-500 rounded"
                checked={rules[key] ?? (key === 'freeHitEnabled')}
                onChange={e => setRule(key, e.target.checked)}
              />
              <span className="text-app text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary flex-1 justify-center py-3" onClick={onBack} id="step3-back">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button className="btn-primary flex-1 justify-center py-3" onClick={onNext} id="step3-next">
          Review & Start <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Confirmation ─────────────────────────────────────

function Step4({ draft, onBack, onCreate }: { draft: any; onBack: () => void; onCreate: () => void }) {
  const team1 = draft.team1 as Team;
  const team2 = draft.team2 as Team;
  const rules = draft.rules || {};

  const battingTeamId = draft.toss
    ? draft.toss.decision === 'bat' ? draft.toss.winnerTeamId : (draft.toss.winnerTeamId === team1?.id ? team2?.id : team1?.id)
    : team1?.id;
  const battingTeam = battingTeamId === team1?.id ? team1 : team2;

  return (
    <div className="space-y-4">
      <div className="card rounded-xl p-4 space-y-3">
        <h3 className="text-app font-bold">Match Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Name', draft.name || `${team1?.name} vs ${team2?.name}`],
            ['Date', draft.date],
            ['Venue', draft.venue || 'Not specified'],
            ['Format', draft.format],
            ['Overs', String(draft.oversPerInnings)],
            ['Players/Team', String(draft.playersPerTeam)],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-app-muted text-xs">{k}</div>
              <div className="text-app font-medium">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[team1, team2].map((t, i) => (
          <div key={t?.id} className="card rounded-xl p-3">
            <div className="text-app-muted text-xs mb-1">Team {i+1}</div>
            <div className="text-app font-bold text-sm mb-2">{t?.name}</div>
            <div className="space-y-0.5 max-h-24 overflow-y-auto">
              {t?.players.map((p, idx) => (
                <div key={p.id} className="text-app-secondary text-xs flex items-center gap-1">
                  <span className="text-app-muted">{idx+1}.</span> {p.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {draft.toss && (
        <div className="card rounded-xl p-4">
          <div className="text-app-muted text-xs mb-1">Toss</div>
          <div className="text-app text-sm">
            <strong>{battingTeam?.name}</strong> won the toss and elected to{' '}
            <strong>{draft.toss.decision}</strong>
          </div>
        </div>
      )}

      <div className="card rounded-xl p-4">
        <div className="text-app-muted text-xs mb-2">Rules</div>
        <div className="flex flex-wrap gap-2">
          {[
            `${rules.maxOversPerBowler ?? Math.ceil(draft.oversPerInnings / 5)} overs/bowler`,
            `Wide +${rules.widePenalty ?? 1}`,
            `No-Ball +${rules.noBallPenalty ?? 1}`,
            rules.freeHitEnabled !== false && 'Free Hit',
            rules.powerplayEnabled && 'Powerplay',
            rules.superOverEnabled && 'Super Over',
          ].filter(Boolean).map(r => (
            <span key={String(r)} className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn-secondary flex-1 justify-center py-3" onClick={onBack} id="step4-back">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button className="btn-gold flex-1 justify-center py-3 text-base font-bold" onClick={onCreate} id="start-match">
          <Trophy className="w-5 h-5" /> Start Match!
        </button>
      </div>
    </div>
  );
}

// ─── Main Wizard ─────────────────────────────────────────────

const STEPS = [
  { label: 'Match Details', icon: Settings },
  { label: 'Teams & Players', icon: Users },
  { label: 'Toss & Rules', icon: Settings },
  { label: 'Confirm', icon: CheckCircle },
];

export default function MatchSetupPage() {
  const navigate = useNavigate();
  const { matchSetupDraft, updateSetupDraft, setupStep, setSetupStep, createMatch, resetSetupDraft } = useStore();

  useEffect(() => {
    resetSetupDraft();
  }, []);

  const handleCreate = () => {
    const match = createMatch();
    if (match) {
      navigate('/live');
    }
  };

  const stepContent = () => {
    switch (setupStep) {
      case 1: return <Step1 draft={matchSetupDraft} update={updateSetupDraft} onNext={() => setSetupStep(2)} />;
      case 2: return <Step2 draft={matchSetupDraft} update={updateSetupDraft} onNext={() => setSetupStep(3)} onBack={() => setSetupStep(1)} />;
      case 3: return <Step3 draft={matchSetupDraft} update={updateSetupDraft} onNext={() => setSetupStep(4)} onBack={() => setSetupStep(2)} />;
      case 4: return <Step4 draft={matchSetupDraft} onBack={() => setSetupStep(3)} onCreate={handleCreate} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-app py-6 sm:py-10 px-3 sm:px-6 pb-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-app">New Match Setup</h1>
          <p className="text-app-secondary text-sm mt-1">Configure format, squads, toss, and local rules</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 relative px-2">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 bg-app-secondary border-t border-app" style={{zIndex:0}} />
          {STEPS.map((step, idx) => {
            const num = idx + 1;
            const done = setupStep > num;
            const active = setupStep === num;
            return (
              <div key={step.label} className="flex flex-col items-center gap-1.5 relative z-10">
                <button
                  type="button"
                  onClick={() => num < setupStep && setSetupStep(num)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                    done ? 'bg-green-600 border-green-600 text-white shadow-xs' :
                    active ? 'bg-app border-green-600 text-green-600 ring-4 ring-green-500/10' :
                    'bg-app-secondary border-app text-app-muted'
                  }`}
                  id={`step-indicator-${num}`}
                  aria-label={`Step ${num}: ${step.label}`}
                >
                  {done ? <CheckCircle className="w-4 h-4" /> : num}
                </button>
                <span className={`text-[11px] hidden sm:block ${active ? 'text-green-600 font-extrabold' : 'text-app-muted'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current step */}
        <div className="card rounded-2xl p-6">
          <h2 className="text-app font-bold text-lg mb-5 flex items-center gap-2">
            {(() => { const S = STEPS[setupStep - 1]; return <S.icon className="w-5 h-5 text-green-500" />; })()}
            {STEPS[setupStep - 1]?.label}
          </h2>
          {stepContent()}
        </div>
      </div>
    </div>
  );
}
