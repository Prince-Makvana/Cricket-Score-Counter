// ============================================================
// Zustand Store – CricketMate App State
// ============================================================

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  MatchState,
  Team,
  Player,
  AppSettings,
  InningsState,
  MatchRules,
  MatchFormat,
  TossResult,
  ModalType,
} from '../scoring/types';
import {
  applyDelivery,
  createInitialInningsState,
  type DeliveryInput,
} from '../scoring/scoringEngine';
import { determineMatchResult } from '../scoring/inningsCalculator';
import * as storage from '../services/storageService';

// ─── Store Interface ──────────────────────────────────────────

interface MatchSetupDraft {
  // Step 1
  name: string;
  venue: string;
  date: string;
  format: MatchFormat;
  oversPerInnings: number;
  playersPerTeam: number;
  // Step 2
  team1: Team | null;
  team2: Team | null;
  openingBatter1Id: string;
  openingBatter2Id: string;
  openingBowlerId: string;
  // Step 3
  toss: TossResult | null;
  rules: Partial<MatchRules>;
}

interface AppStore {
  // ─ Global ─
  settings: AppSettings;
  activeModal: ModalType;
  matches: MatchState[];
  teams: Team[];
  players: Player[];

  // ─ Current match ─
  currentMatch: MatchState | null;
  matchSetupDraft: MatchSetupDraft;
  setupStep: number;

  // ─ Actions: Settings ─
  loadSettings: () => void;
  saveSettings: (s: Partial<AppSettings>) => void;

  // ─ Actions: Load state from storage ─
  loadAll: () => void;

  // ─ Actions: Teams ─
  saveTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;

  // ─ Actions: Players ─
  savePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;

  // ─ Actions: Match setup ─
  updateSetupDraft: (partial: Partial<MatchSetupDraft>) => void;
  setSetupStep: (step: number) => void;
  resetSetupDraft: () => void;

  // ─ Actions: Match lifecycle ─
  createMatch: () => MatchState | null;
  loadMatch: (id: string) => void;
  pauseMatch: () => void;
  abandonMatch: () => void;
  deleteMatch: (id: string) => void;

  // ─ Actions: Scoring ─
  recordDelivery: (input: DeliveryInput) => void;
  undoLastDelivery: () => void;
  endInnings: () => void;
  startNextInnings: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
  changeBowler: (bowlerId: string) => void;

  // ─ Modal ─
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
}

// ─── Default draft ────────────────────────────────────────────

const defaultDraft = (): MatchSetupDraft => ({
  name: '',
  venue: '',
  date: new Date().toISOString().slice(0, 10),
  format: 'T20',
  oversPerInnings: 20,
  playersPerTeam: 11,
  team1: null,
  team2: null,
  openingBatter1Id: '',
  openingBatter2Id: '',
  openingBowlerId: '',
  toss: null,
  rules: {},
});

// ─── Helper ───────────────────────────────────────────────────

function getPlayerName(match: MatchState, id: string): string {
  for (const team of Object.values(match.teams)) {
    const p = team.players.find(pl => pl.id === id);
    if (p) return p.name;
  }
  return 'Unknown';
}

function getCurrentInnings(match: MatchState): InningsState | undefined {
  return match.innings[match.currentInnings] as InningsState | undefined;
}

// ─── Store ───────────────────────────────────────────────────

export const useStore = create<AppStore>((set, get) => ({
  settings: storage.getSettings(),
  activeModal: null,
  matches: [],
  teams: [],
  players: [],
  currentMatch: null,
  matchSetupDraft: defaultDraft(),
  setupStep: 1,

  // ── Load all ──────────────────────────────────────────────
  loadAll: () => {
    const settings = storage.getSettings();
    const matches = storage.getAllMatches();
    const teams = storage.getAllTeams();
    const players = storage.getAllPlayers();
    set({ settings, matches, teams, players });
    // Apply theme
    applyTheme(settings.theme);
  },

  // ── Settings ─────────────────────────────────────────────
  loadSettings: () => {
    const settings = storage.getSettings();
    applyTheme(settings.theme);
    set({ settings });
  },

  saveSettings: (partial) => {
    storage.saveSettings(partial);
    const settings = storage.getSettings();
    applyTheme(settings.theme);
    set({ settings });
  },

  // ── Teams ────────────────────────────────────────────────
  saveTeam: (team) => {
    storage.saveTeam(team);
    set({ teams: storage.getAllTeams() });
  },

  deleteTeam: (id) => {
    storage.deleteTeam(id);
    set({ teams: storage.getAllTeams() });
  },

  // ── Players ──────────────────────────────────────────────
  savePlayer: (player) => {
    storage.savePlayer(player);
    set({ players: storage.getAllPlayers() });
  },

  deletePlayer: (id) => {
    storage.deletePlayer(id);
    set({ players: storage.getAllPlayers() });
  },

  // ── Setup draft ──────────────────────────────────────────
  updateSetupDraft: (partial) => {
    set(s => ({ matchSetupDraft: { ...s.matchSetupDraft, ...partial } }));
  },

  setSetupStep: (step) => set({ setupStep: step }),

  resetSetupDraft: () => set({ matchSetupDraft: defaultDraft(), setupStep: 1 }),

  // ── Create match ─────────────────────────────────────────
  createMatch: () => {
    const draft = get().matchSetupDraft;
    if (!draft.team1 || !draft.team2) return null;

    const rules: MatchRules = {
      oversPerInnings: draft.oversPerInnings,
      playersPerTeam: draft.playersPerTeam,
      maxOversPerBowler: draft.rules.maxOversPerBowler ?? Math.ceil(draft.oversPerInnings / 5),
      widePenalty: draft.rules.widePenalty ?? 1,
      noBallPenalty: draft.rules.noBallPenalty ?? 1,
      freeHitEnabled: draft.rules.freeHitEnabled ?? true,
      powerplayEnabled: draft.rules.powerplayEnabled ?? false,
      powerplayOvers: draft.rules.powerplayOvers ?? 6,
      superOverEnabled: draft.rules.superOverEnabled ?? false,
    };

    // Determine batting team based on toss
    const battingTeamId = draft.toss
      ? draft.toss.decision === 'bat'
        ? draft.toss.winnerTeamId
        : (draft.toss.winnerTeamId === draft.team1.id ? draft.team2.id : draft.team1.id)
      : draft.team1.id;
    const bowlingTeamId = battingTeamId === draft.team1.id ? draft.team2.id : draft.team1.id;

    const battingTeam = battingTeamId === draft.team1.id ? draft.team1 : draft.team2;
    const innings1 = createInitialInningsState(
      1,
      battingTeamId,
      bowlingTeamId,
      draft.openingBatter1Id || (battingTeam.players[0]?.id ?? ''),
      draft.openingBatter2Id || (battingTeam.players[1]?.id ?? ''),
      draft.openingBowlerId || ((battingTeamId === draft.team1.id ? draft.team2 : draft.team1).players[0]?.id ?? ''),
      battingTeam.players.map(p => ({ id: p.id, name: p.name }))
    );

    const match: MatchState = {
      id: uuidv4(),
      name: draft.name || `${draft.team1.name} vs ${draft.team2.name}`,
      venue: draft.venue,
      date: draft.date,
      format: draft.format,
      rules,
      teams: {
        [draft.team1.id]: draft.team1,
        [draft.team2.id]: draft.team2,
      },
      team1Id: draft.team1.id,
      team2Id: draft.team2.id,
      toss: draft.toss ?? undefined,
      innings: [innings1, undefined],
      currentInnings: 0,
      status: 'live',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    storage.saveMatch(match);
    set({ currentMatch: match, matches: storage.getAllMatches() });
    return match;
  },

  // ── Load match ───────────────────────────────────────────
  loadMatch: (id) => {
    const match = storage.getMatch(id);
    if (match) set({ currentMatch: match });
  },

  // ── Pause/Abandon ────────────────────────────────────────
  pauseMatch: () => {
    const match = get().currentMatch;
    if (!match) return;
    const updated = { ...match, status: 'paused' as const };
    storage.saveMatch(updated);
    set({ currentMatch: updated, matches: storage.getAllMatches() });
  },

  abandonMatch: () => {
    const match = get().currentMatch;
    if (!match) return;
    const updated = { ...match, status: 'abandoned' as const };
    storage.saveMatch(updated);
    set({ currentMatch: updated, matches: storage.getAllMatches() });
  },

  deleteMatch: (id) => {
    storage.deleteMatch(id);
    set(s => ({
      matches: storage.getAllMatches(),
      currentMatch: s.currentMatch?.id === id ? null : s.currentMatch,
    }));
  },

  // ── Record delivery ──────────────────────────────────────
  recordDelivery: (input) => {
    const match = get().currentMatch;
    if (!match) return;

    const innings = getCurrentInnings(match);
    if (!innings) return;

    const bowlerName = getPlayerName(match, input.bowlerId);
    const replacementName = input.wicket?.replacementBatterId
      ? getPlayerName(match, input.wicket.replacementBatterId)
      : undefined;

    const enrichedInput: DeliveryInput = {
      ...input,
      widePenalty: match.rules.widePenalty,
      noBallPenalty: match.rules.noBallPenalty,
      freeHitEnabled: match.rules.freeHitEnabled,
    };

    const newInnings = applyDelivery(
      innings,
      enrichedInput,
      bowlerName,
      replacementName,
      (id) => getPlayerName(match, id)
    );

    // Check all-out
    const maxWickets = match.rules.playersPerTeam - 1;
    const maxBalls = match.rules.oversPerInnings * 6;
    const allOut = newInnings.wickets >= maxWickets;
    const oversUp = newInnings.legalBalls >= maxBalls;

    const newInningsArray: [InningsState?, InningsState?] = [...match.innings] as [InningsState?, InningsState?];
    newInningsArray[match.currentInnings] = newInnings;

    const tempMatch: MatchState = { ...match, innings: newInningsArray };

    // Check for match result
    let result = match.result;
    let status = match.status;

    if (match.currentInnings === 1) {
      const matchResult = determineMatchResult(tempMatch);
      if (matchResult) {
        result = matchResult;
        status = 'completed';
        newInnings.status = 'completed';
      }
    }

    if ((allOut || oversUp) && status !== 'completed') {
      if (match.currentInnings === 0) {
        newInnings.status = 'completed';
        status = 'innings_break';
      } else {
        newInnings.status = 'completed';
        status = 'completed';
      }
    }

    newInningsArray[match.currentInnings] = newInnings;

    const updated: MatchState = {
      ...match,
      innings: newInningsArray,
      status,
      result,
    };

    storage.saveMatch(updated);
    set({ currentMatch: updated, matches: storage.getAllMatches() });

    // Open appropriate modal
    if (status === 'completed') {
      get().openModal('match_complete');
    } else if (status === 'innings_break') {
      get().openModal('innings_break');
    } else if (newInnings.legalBalls > 0 && newInnings.legalBalls % 6 === 0) {
      get().openModal('end_over');
    }
  },

  // ── Undo last delivery ───────────────────────────────────
  undoLastDelivery: () => {
    const match = get().currentMatch;
    if (!match) return;

    const innings = getCurrentInnings(match);
    if (!innings || innings.deliveries.length === 0) return;

    // Remove last delivery and rebuild innings from history
    const remaining = innings.deliveries.slice(0, -1);

    // Reset innings to initial state
    const firstDelivery = innings.deliveries[0];
    if (!firstDelivery) return;

    const battingTeam = match.teams[innings.battingTeamId];
    const fresh = createInitialInningsState(
      innings.inningsNumber,
      innings.battingTeamId,
      innings.bowlingTeamId,
      firstDelivery.strikerId,
      firstDelivery.nonStrikerId,
      firstDelivery.bowlerId,
      battingTeam.players.map(p => ({ id: p.id, name: p.name }))
    );

    // Replay remaining deliveries
    let rebuilt = fresh;
    for (const d of remaining) {
      const input: DeliveryInput = {
        batterRuns: d.batterRuns,
        extraType: d.extraType,
        extraRuns: d.isWide ? d.extraRuns - match.rules.widePenalty :
                   d.isNoBall ? d.extraRuns - match.rules.noBallPenalty :
                   d.extraRuns,
        isWide: d.isWide,
        isNoBall: d.isNoBall,
        isBye: d.isBye,
        isLegBye: d.isLegBye,
        isWicket: d.isWicket,
        wicket: d.wicket,
        bowlerId: d.bowlerId,
        widePenalty: match.rules.widePenalty,
        noBallPenalty: match.rules.noBallPenalty,
        freeHitEnabled: match.rules.freeHitEnabled,
      };
      const bowlerName = getPlayerName(match, d.bowlerId);
      const replacementName = d.wicket?.replacementBatterId
        ? getPlayerName(match, d.wicket.replacementBatterId)
        : undefined;
      rebuilt = applyDelivery(rebuilt, input, bowlerName, replacementName, (id) => getPlayerName(match, id));
    }

    const newInningsArray: [InningsState?, InningsState?] = [...match.innings] as [InningsState?, InningsState?];
    newInningsArray[match.currentInnings] = rebuilt;

    const updated: MatchState = {
      ...match,
      innings: newInningsArray,
      status: 'live',
      result: undefined,
    };

    storage.saveMatch(updated);
    set({ currentMatch: updated, matches: storage.getAllMatches() });
  },

  // ── End innings ──────────────────────────────────────────
  endInnings: () => {
    const match = get().currentMatch;
    if (!match) return;

    const innings = getCurrentInnings(match);
    if (!innings) return;

    const newInningsArray: [InningsState?, InningsState?] = [...match.innings] as [InningsState?, InningsState?];
    const completed = { ...innings, status: 'completed' as const };
    newInningsArray[match.currentInnings] = completed;

    const updated: MatchState = {
      ...match,
      innings: newInningsArray,
      status: match.currentInnings === 0 ? 'innings_break' : 'completed',
    };

    storage.saveMatch(updated);
    set({ currentMatch: updated, matches: storage.getAllMatches() });
    get().openModal(match.currentInnings === 0 ? 'innings_break' : 'match_complete');
  },

  // ── Start next innings ───────────────────────────────────
  startNextInnings: (strikerId, nonStrikerId, bowlerId) => {
    const match = get().currentMatch;
    if (!match || match.currentInnings !== 0) return;

    const inn1 = match.innings[0] as InningsState;
    const battingTeamId = inn1.bowlingTeamId; // reversed
    const bowlingTeamId = inn1.battingTeamId;
    const battingTeam = match.teams[battingTeamId];

    const innings2 = createInitialInningsState(
      2,
      battingTeamId,
      bowlingTeamId,
      strikerId,
      nonStrikerId,
      bowlerId,
      battingTeam.players.map(p => ({ id: p.id, name: p.name }))
    );

    const newInningsArray: [InningsState?, InningsState?] = [inn1, innings2];

    const updated: MatchState = {
      ...match,
      innings: newInningsArray,
      currentInnings: 1,
      status: 'live',
    };

    storage.saveMatch(updated);
    set({ currentMatch: updated, matches: storage.getAllMatches() });
    get().closeModal();
  },

  // ── Change bowler ────────────────────────────────────────
  changeBowler: (bowlerId) => {
    const match = get().currentMatch;
    if (!match) return;
    const innings = getCurrentInnings(match);
    if (!innings) return;

    const newInnings = { ...innings, currentBowlerId: bowlerId };
    const newInningsArray: [InningsState?, InningsState?] = [...match.innings] as [InningsState?, InningsState?];
    newInningsArray[match.currentInnings] = newInnings;

    const updated: MatchState = { ...match, innings: newInningsArray };
    storage.saveMatch(updated);
    set({ currentMatch: updated });
    get().closeModal();
  },

  // ── Modals ───────────────────────────────────────────────
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));

// ─── Theme helper ─────────────────────────────────────────────

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}
