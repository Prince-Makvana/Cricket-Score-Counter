// ============================================================
// Storage Service – localStorage with versioning & error handling
// ============================================================

import type { MatchState, Team, Player, AppSettings, StorageData } from '../scoring/types';

const STORAGE_KEY = 'cricketmate_data';
const STORAGE_VERSION = 2;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultFormat: 'T20',
  defaultOvers: 20,
  defaultPlayersPerTeam: 11,
  defaultWidePenalty: 1,
  defaultNoBallPenalty: 1,
  freeHitEnabled: true,
  soundEnabled: false,
  confirmEachDelivery: false,
  version: STORAGE_VERSION,
};

function getDefaultData(): StorageData {
  return {
    matches: [],
    teams: [],
    players: [],
    settings: DEFAULT_SETTINGS,
    version: STORAGE_VERSION,
  };
}

// ─── Low-level read/write ────────────────────────────────────

function loadRaw(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as Partial<StorageData>;
    // Version migration
    if (!parsed.version || parsed.version < STORAGE_VERSION) {
      return migrateData(parsed);
    }
    return {
      matches: parsed.matches ?? [],
      teams: parsed.teams ?? [],
      players: parsed.players ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      version: STORAGE_VERSION,
    };
  } catch {
    console.warn('[StorageService] Failed to parse storage, resetting.');
    return getDefaultData();
  }
}

function saveRaw(data: StorageData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      console.error('[StorageService] Storage quota exceeded.');
    } else {
      console.error('[StorageService] Failed to save data.', e);
    }
    return false;
  }
}

function migrateData(old: Partial<StorageData>): StorageData {
  // Future migrations go here
  return {
    matches: old.matches ?? [],
    teams: old.teams ?? [],
    players: old.players ?? [],
    settings: { ...DEFAULT_SETTINGS, ...(old.settings ?? {}) },
    version: STORAGE_VERSION,
  };
}

// ─── Matches ─────────────────────────────────────────────────

export function getAllMatches(): MatchState[] {
  return loadRaw().matches;
}

export function getMatch(id: string): MatchState | undefined {
  return loadRaw().matches.find(m => m.id === id);
}

export function saveMatch(match: MatchState): boolean {
  const data = loadRaw();
  const idx = data.matches.findIndex(m => m.id === match.id);
  const updated = { ...match, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    data.matches[idx] = updated;
  } else {
    data.matches.unshift(updated);
  }
  return saveRaw(data);
}

export function deleteMatch(id: string): boolean {
  const data = loadRaw();
  data.matches = data.matches.filter(m => m.id !== id);
  return saveRaw(data);
}

export function getLiveMatches(): MatchState[] {
  return loadRaw().matches.filter(m => m.status === 'live' || m.status === 'paused' || m.status === 'innings_break');
}

export function getCompletedMatches(): MatchState[] {
  return loadRaw().matches.filter(m => m.status === 'completed' || m.status === 'abandoned');
}

// ─── Teams ───────────────────────────────────────────────────

export function getAllTeams(): Team[] {
  return loadRaw().teams;
}

export function getTeam(id: string): Team | undefined {
  return loadRaw().teams.find(t => t.id === id);
}

export function saveTeam(team: Team): boolean {
  const data = loadRaw();
  const idx = data.teams.findIndex(t => t.id === team.id);
  const updated = { ...team, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    data.teams[idx] = updated;
  } else {
    data.teams.unshift(updated);
  }
  return saveRaw(data);
}

export function deleteTeam(id: string): boolean {
  const data = loadRaw();
  data.teams = data.teams.filter(t => t.id !== id);
  return saveRaw(data);
}

// ─── Players ─────────────────────────────────────────────────

export function getAllPlayers(): Player[] {
  return loadRaw().players;
}

export function savePlayer(player: Player): boolean {
  const data = loadRaw();
  const idx = data.players.findIndex(p => p.id === player.id);
  if (idx >= 0) {
    data.players[idx] = player;
  } else {
    data.players.unshift(player);
  }
  return saveRaw(data);
}

export function deletePlayer(id: string): boolean {
  const data = loadRaw();
  data.players = data.players.filter(p => p.id !== id);
  return saveRaw(data);
}

// ─── Settings ────────────────────────────────────────────────

export function getSettings(): AppSettings {
  return loadRaw().settings;
}

export function saveSettings(settings: Partial<AppSettings>): boolean {
  const data = loadRaw();
  data.settings = { ...data.settings, ...settings };
  return saveRaw(data);
}

// ─── Export / Import ─────────────────────────────────────────

export function exportData(): string {
  return JSON.stringify(loadRaw(), null, 2);
}

export function importData(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString) as Partial<StorageData>;
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { success: false, error: 'Invalid data format.' };
    }
    const data = migrateData(parsed);
    saveRaw(data);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to parse JSON.' };
  }
}

export function clearAllData(): boolean {
  return saveRaw(getDefaultData());
}

// ─── Storage usage ───────────────────────────────────────────

export function getStorageUsageKB(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '';
    return Math.round((raw.length * 2) / 1024); // UTF-16
  } catch {
    return 0;
  }
}
