// ============================================================
// CricketMate – Core Type Definitions
// ============================================================

// ─── Player & Team ───────────────────────────────────────────

export type PlayerRole = 'batter' | 'bowler' | 'allrounder' | 'wicketkeeper';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  jerseyNumber?: number;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

// ─── Delivery / Event ────────────────────────────────────────

export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye' | 'noball_bye' | 'noball_legbye' | 'noball_runs';

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'caught_and_bowled'
  | 'lbw'
  | 'stumped'
  | 'run_out'
  | 'hit_wicket'
  | 'hit_ball_twice'
  | 'obstructing_field'
  | 'retired_out'
  | 'timed_out'
  | 'retired_hurt';

export interface WicketInfo {
  dismissalType: DismissalType;
  dismissedBatterId: string;         // which batter is out
  fielder1Id?: string;               // catcher / run-out fielder
  fielder2Id?: string;               // run-out second fielder
  isRetiredHurt: boolean;            // doesn't count as wicket
  replacementBatterId?: string;
}

export interface Delivery {
  id: string;
  overNumber: number;                // 0-indexed over
  ballInOver: number;                // 0-indexed legal ball within over (before this delivery)
  legalBallNumber: number;           // cumulative legal balls (0-indexed, before this delivery)
  batterRuns: number;                // runs scored by bat
  extraType?: ExtraType;
  extraRuns: number;                 // penalty + bye/legbye etc.
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  isWicket: boolean;
  wicket?: WicketInfo;
  strikerId: string;                 // who faced the ball
  nonStrikerId: string;
  bowlerId: string;
  totalRunsScored: number;           // batterRuns + extraRuns (convenience)
  strikerAfter: string;              // who is striker AFTER this delivery
  nonStrikerAfter: string;
  timestamp: string;
  // free-hit indicator
  isFreeHit: boolean;
}export interface DeliveryInput {
  batterRuns: number;
  extraType?: ExtraType;
  extraRuns?: number;
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  isWicket: boolean;
  wicket?: WicketInfo;
  bowlerId: string;
  widePenalty?: number;
  noBallPenalty?: number;
  freeHitEnabled?: boolean;
}

// ─── Statistics ───────────────────────────────────────────────

export interface BatterStats {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalInfo?: string;
  strikeRate: number;
  isStriker: boolean;
  isRetiredHurt: boolean;
}

export interface BowlerStats {
  playerId: string;
  name: string;
  legalBalls: number;                // for over count
  runsConc: number;                  // runs attributed to bowler
  wickets: number;
  wides: number;
  noBalls: number;
  maidens: number;
  economy: number;
  overs: string;                     // display string e.g. "3.4"
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  overs: string;
  batterId: string;
  batterName: string;
  dismissalInfo: string;
}

export interface Partnership {
  batter1Id: string;
  batter2Id: string;
  runs: number;
  balls: number;
  startScore: number;
}

// ─── Innings ─────────────────────────────────────────────────

export type InningsStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export interface InningsState {
  inningsNumber: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  wickets: number;
  legalBalls: number;               // total legal deliveries
  totalDeliveries: number;          // including wides/no-balls
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
  strikerId: string;
  nonStrikerId: string;
  currentBowlerId: string;
  deliveries: Delivery[];
  batterStats: Record<string, BatterStats>;
  bowlerStats: Record<string, BowlerStats>;
  fallOfWickets: FallOfWicket[];
  partnerships: Partnership[];
  currentPartnership: Partnership;
  overHistory: OverSummary[];
  currentOverBalls: Delivery[];
  status: InningsStatus;
  retiredHurtBatters: string[];
  nextFreeHit: boolean;             // next ball is a free hit
}

export interface OverSummary {
  overNumber: number;              // 1-indexed
  bowlerId: string;
  bowlerName: string;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
  isMaiden: boolean;
  balls: string[];                 // display strings e.g. ['1', 'W', '0', 'nb', '4', '2']
}

// ─── Match ───────────────────────────────────────────────────

export type MatchFormat = 'T20' | 'ODI' | 'T10' | 'The Hundred' | 'Custom';
export type MatchStatus = 'setup' | 'toss' | 'live' | 'innings_break' | 'completed' | 'abandoned' | 'paused';

export interface MatchRules {
  oversPerInnings: number;
  playersPerTeam: number;
  maxOversPerBowler: number;
  widePenalty: number;             // default 1
  noBallPenalty: number;           // default 1
  freeHitEnabled: boolean;
  powerplayEnabled: boolean;
  powerplayOvers: number;
  superOverEnabled: boolean;
}

export interface TossResult {
  winnerTeamId: string;
  decision: 'bat' | 'bowl';
}

export interface MatchState {
  id: string;
  name: string;
  venue?: string;
  date: string;
  format: MatchFormat;
  rules: MatchRules;
  teams: {
    [teamId: string]: Team;
  };
  team1Id: string;
  team2Id: string;
  toss?: TossResult;
  innings: [InningsState?, InningsState?];
  currentInnings: 0 | 1;
  status: MatchStatus;
  result?: MatchResult;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MatchResult {
  winnerId?: string;
  winnerName?: string;
  margin?: string;                 // "5 wickets" | "34 runs" | "Tied" | "Super Over"
  resultType: 'win' | 'tie' | 'no_result' | 'abandoned';
  description: string;
}

// ─── Settings ────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: Theme;
  defaultFormat: MatchFormat;
  defaultOvers: number;
  defaultPlayersPerTeam: number;
  defaultWidePenalty: number;
  defaultNoBallPenalty: number;
  freeHitEnabled: boolean;
  soundEnabled: boolean;
  confirmEachDelivery: boolean;
  version: number;
}

// ─── Storage ─────────────────────────────────────────────────

export interface StorageData {
  matches: MatchState[];
  teams: Team[];
  players: Player[];
  settings: AppSettings;
  version: number;
}

// ─── UI helpers ──────────────────────────────────────────────

export interface ScoringAction {
  type: 'runs' | 'wide' | 'noball' | 'bye' | 'legbye' | 'wicket' | 'undo' | 'end_over' | 'end_innings';
  runs?: number;
  extraType?: ExtraType;
  batterRuns?: number;
  extraRuns?: number;
  wicket?: WicketInfo;
}

export type ModalType =
  | 'wicket'
  | 'end_over'
  | 'innings_break'
  | 'match_complete'
  | 'confirm_undo'
  | 'super_over'
  | null;
