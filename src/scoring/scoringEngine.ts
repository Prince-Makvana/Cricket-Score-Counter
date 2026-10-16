// ============================================================
// Scoring Engine – Core Pure Function
// ============================================================
// applyDelivery: (InningsState, DeliveryInput) → InningsState
// replayInnings: (Delivery[]) → InningsState (for undo/correction)

import { v4 as uuidv4 } from 'uuid';
import type {
  InningsState,
  Delivery,
  BatterStats,
  BowlerStats,
  WicketInfo,
  FallOfWicket,
  OverSummary,
  DeliveryInput,
} from './types';
import { calculateStrikeAfterDelivery, applyEndOfOverStrikeSwap } from './strikeCalculator';
import { buildOverSummary, legalBallsToOvers } from './overCalculator';

export type { DeliveryInput };


// ─── Dismissal attribution helpers ───────────────────────────

const BOWLER_WICKETS = new Set([
  'bowled', 'caught', 'caught_and_bowled', 'lbw', 'stumped', 'hit_wicket',
  'hit_ball_twice', 'obstructing_field',
]);

function isBowlerWicket(dismissalType: string): boolean {
  return BOWLER_WICKETS.has(dismissalType);
}

function dismissalDisplayString(wicket: WicketInfo, fielderName?: string): string {
  switch (wicket.dismissalType) {
    case 'bowled': return 'b';
    case 'caught': return fielderName ? `c ${fielderName} b` : 'c & b';
    case 'caught_and_bowled': return 'c & b';
    case 'lbw': return 'lbw b';
    case 'stumped': return fielderName ? `st ${fielderName} b` : 'st b';
    case 'run_out': return fielderName ? `run out (${fielderName})` : 'run out';
    case 'hit_wicket': return 'hit wicket b';
    case 'hit_ball_twice': return 'hit ball twice';
    case 'obstructing_field': return 'obstructing field';
    case 'retired_out': return 'retired out';
    case 'timed_out': return 'timed out';
    case 'retired_hurt': return 'retired hurt';
    default: return '';
  }
}

// ─── Initial state factory ────────────────────────────────────

export function createInitialInningsState(
  inningsNumber: 1 | 2,
  battingTeamId: string,
  bowlingTeamId: string,
  strikerId: string,
  nonStrikerId: string,
  bowlerId: string,
  players: { id: string; name: string }[]
): InningsState {
  const batterStats: Record<string, BatterStats> = {};
  const bowlerStats: Record<string, BowlerStats> = {};

  for (const p of players) {
    batterStats[p.id] = {
      playerId: p.id,
      name: p.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      strikeRate: 0,
      isStriker: p.id === strikerId,
      isRetiredHurt: false,
    };
  }

  const currentPartnership = {
    batter1Id: strikerId,
    batter2Id: nonStrikerId,
    runs: 0,
    balls: 0,
    startScore: 0,
  };

  return {
    inningsNumber,
    battingTeamId,
    bowlingTeamId,
    totalRuns: 0,
    wickets: 0,
    legalBalls: 0,
    totalDeliveries: 0,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
    strikerId,
    nonStrikerId,
    currentBowlerId: bowlerId,
    deliveries: [],
    batterStats,
    bowlerStats,
    fallOfWickets: [],
    partnerships: [],
    currentPartnership,
    overHistory: [],
    currentOverBalls: [],
    status: 'in_progress',
    retiredHurtBatters: [],
    nextFreeHit: false,
  };
}

// ─── Ensure bowler stats exist ────────────────────────────────

function ensureBowler(bowlerStats: Record<string, BowlerStats>, bowlerId: string, name: string): BowlerStats {
  if (!bowlerStats[bowlerId]) {
    bowlerStats[bowlerId] = {
      playerId: bowlerId,
      name,
      legalBalls: 0,
      runsConc: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      maidens: 0,
      economy: 0,
      overs: '0.0',
    };
  }
  return bowlerStats[bowlerId];
}

// ─── Main function ────────────────────────────────────────────

export function applyDelivery(
  state: InningsState,
  input: DeliveryInput,
  bowlerName: string,
  replacementBatterName?: string,
  getPlayerName?: (id: string) => string
): InningsState {
  // Deep-clone state to keep immutability
  const s: InningsState = JSON.parse(JSON.stringify(state));

  const widePenalty = input.widePenalty ?? 1;
  const noBallPenalty = input.noBallPenalty ?? 1;

  // ─ Compute runs ─
  let extraRuns = 0;
  if (input.isWide) extraRuns = widePenalty + (input.extraRuns ?? 0);
  else if (input.isNoBall) extraRuns = noBallPenalty + (input.extraRuns ?? 0);
  else if (input.isBye || input.isLegBye) extraRuns = input.extraRuns ?? 0;

  const totalRuns = input.batterRuns + extraRuns;

  // ─ Build delivery skeleton ─
  const legalBefore = s.legalBalls;
  const overNumber = Math.floor(legalBefore / 6);
  const ballInOver = legalBefore % 6;
  const legal = !input.isWide && !input.isNoBall;

  const delivery: Delivery = {
    id: uuidv4(),
    overNumber,
    ballInOver,
    legalBallNumber: legalBefore,
    batterRuns: input.batterRuns,
    extraType: input.extraType,
    extraRuns,
    isWide: input.isWide,
    isNoBall: input.isNoBall,
    isBye: input.isBye,
    isLegBye: input.isLegBye,
    isWicket: input.isWicket,
    wicket: input.wicket,
    strikerId: s.strikerId,
    nonStrikerId: s.nonStrikerId,
    bowlerId: input.bowlerId,
    totalRunsScored: totalRuns,
    strikerAfter: s.strikerId,   // will be updated below
    nonStrikerAfter: s.nonStrikerId,
    timestamp: new Date().toISOString(),
    isFreeHit: s.nextFreeHit,
  };

  // ─ Update totals ─
  s.totalRuns += totalRuns;
  s.totalDeliveries += 1;

  // ─ Legal balls ─
  if (legal) s.legalBalls += 1;

  // ─ Extras ─
  if (input.isWide) {
    s.extras.wides += widePenalty + (input.extraRuns ?? 0);
    s.extras.total += widePenalty + (input.extraRuns ?? 0);
  }
  if (input.isNoBall) {
    s.extras.noBalls += noBallPenalty;
    s.extras.total += noBallPenalty;
    // batter runs from no-ball go to batter stats, not extras
  }
  if (input.isBye) {
    s.extras.byes += extraRuns;
    s.extras.total += extraRuns;
  }
  if (input.isLegBye) {
    s.extras.legByes += extraRuns;
    s.extras.total += extraRuns;
  }

  // ─ Bowler stats ─
  const bStats = ensureBowler(s.bowlerStats, input.bowlerId, bowlerName);
  if (legal) bStats.legalBalls += 1;
  if (input.isWide) bStats.wides += 1;
  if (input.isNoBall) bStats.noBalls += 1;

  // Runs attributed to bowler:
  // - batter runs always (except byes and leg-byes)
  // - wide penalty
  // - no-ball penalty
  // NOT: byes or leg-byes
  if (!input.isBye && !input.isLegBye) {
    bStats.runsConc += totalRuns;
  } else {
    // bye/legbye: only penalty on no-ball goes to bowler
    if (input.isNoBall) bStats.runsConc += noBallPenalty;
  }

  bStats.economy = bStats.legalBalls > 0 ? (bStats.runsConc / bStats.legalBalls) * 6 : 0;
  bStats.overs = legalBallsToOvers(bStats.legalBalls);

  // ─ Batter stats ─
  const striker = s.batterStats[s.strikerId];
  if (striker) {
    // Batter runs: only on non-wide, non-bye, non-legbye
    if (!input.isWide && !input.isBye && !input.isLegBye) {
      striker.runs += input.batterRuns;
      if (input.batterRuns === 4) striker.fours += 1;
      if (input.batterRuns === 6) striker.sixes += 1;
    }
    // Balls faced: only on legal deliveries (not wides; no-balls count)
    if (!input.isWide) striker.balls += 1;
    striker.strikeRate = striker.balls > 0 ? (striker.runs / striker.balls) * 100 : 0;
  }

  // ─ Wicket handling ─
  let replacementBatterId: string | undefined;

  if (input.isWicket && input.wicket) {
    const { dismissedBatterId, isRetiredHurt, dismissalType } = input.wicket;
    replacementBatterId = input.wicket.replacementBatterId;

    if (isRetiredHurt) {
      // Retired hurt: not a wicket, remove from active batters
      s.retiredHurtBatters.push(dismissedBatterId);
      if (s.batterStats[dismissedBatterId]) {
        s.batterStats[dismissedBatterId].isRetiredHurt = true;
      }
    } else {
      s.wickets += 1;

      // Mark dismissed batter
      if (s.batterStats[dismissedBatterId]) {
        s.batterStats[dismissedBatterId].isOut = true;
        s.batterStats[dismissedBatterId].dismissalInfo = dismissalDisplayString(
          input.wicket,
          input.wicket.fielder1Id ? getPlayerName?.(input.wicket.fielder1Id) : undefined
        );
        s.batterStats[dismissedBatterId].isStriker = false;
      }

      // Bowler wicket
      if (isBowlerWicket(dismissalType)) {
        bStats.wickets += 1;
      }

      // Fall of wicket
      const fow: FallOfWicket = {
        wicketNumber: s.wickets,
        score: s.totalRuns,
        overs: legalBallsToOvers(s.legalBalls),
        batterId: dismissedBatterId,
        batterName: s.batterStats[dismissedBatterId]?.name ?? '',
        dismissalInfo: s.batterStats[dismissedBatterId]?.dismissalInfo ?? '',
      };
      s.fallOfWickets.push(fow);

      // Partnership
      const p = s.currentPartnership;
      s.partnerships.push({ ...p });
    }

    // New batter
    if (replacementBatterId && replacementBatterId !== '' && !isRetiredHurt) {
      const replacementName = replacementBatterName ?? 'Unknown';
      s.batterStats[replacementBatterId] = s.batterStats[replacementBatterId] ?? {
        playerId: replacementBatterId,
        name: replacementName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        strikeRate: 0,
        isStriker: false,
        isRetiredHurt: false,
      };
    }
  }

  // ─ Strike calculation ─
  const strikeResult = calculateStrikeAfterDelivery(
    delivery,
    s.strikerId,
    s.nonStrikerId,
    replacementBatterId
  );

  delivery.strikerAfter = strikeResult.strikerAfter;
  delivery.nonStrikerAfter = strikeResult.nonStrikerAfter;

  // Update isStriker flags
  for (const id of Object.keys(s.batterStats)) {
    s.batterStats[id].isStriker = id === strikeResult.strikerAfter;
  }

  s.strikerId = strikeResult.strikerAfter;
  s.nonStrikerId = strikeResult.nonStrikerAfter;

  // ─ Partnership update ─
  s.currentPartnership = {
    batter1Id: s.strikerId,
    batter2Id: s.nonStrikerId,
    runs: (s.currentPartnership?.runs ?? 0) + totalRuns,
    balls: (s.currentPartnership?.balls ?? 0) + (legal ? 1 : 0),
    startScore: s.currentPartnership?.startScore ?? 0,
  };

  // If wicket, reset partnership
  if (input.isWicket && input.wicket && !input.wicket.isRetiredHurt) {
    s.currentPartnership = {
      batter1Id: s.strikerId,
      batter2Id: s.nonStrikerId,
      runs: 0,
      balls: 0,
      startScore: s.totalRuns,
    };
  }

  // ─ Free hit for next ball ─
  s.nextFreeHit = input.freeHitEnabled === true && input.isNoBall;

  // ─ Over management ─
  s.currentOverBalls = [...s.currentOverBalls, delivery];

  if (legal && s.legalBalls % 6 === 0 && s.legalBalls > 0) {
    // Over just completed
    const overSummary: OverSummary = buildOverSummary(
      s.currentOverBalls,
      overNumber + 1,
      input.bowlerId,
      bowlerName
    );
    if (overSummary.isMaiden) bStats.maidens += 1;
    s.overHistory = [...s.overHistory, overSummary];
    s.currentOverBalls = [];

    // End-of-over strike swap
    const [newStriker, newNonStriker] = applyEndOfOverStrikeSwap(s.strikerId, s.nonStrikerId);
    s.strikerId = newStriker;
    s.nonStrikerId = newNonStriker;
    for (const id of Object.keys(s.batterStats)) {
      s.batterStats[id].isStriker = id === newStriker;
    }
  }

  // ─ Store delivery ─
  s.deliveries = [...s.deliveries, delivery];

  return s;
}

// ─── Replay from delivery list (for undo) ────────────────────

export function replayInningsFromDeliveries(
  initialState: InningsState,
  deliveries: Delivery[],
  getInput: (d: Delivery) => DeliveryInput,
  getBowlerName: (id: string) => string,
  getPlayerName: (id: string) => string
): InningsState {
  // Reset to fresh state preserving team/player assignments
  let state: InningsState = {
    ...createInitialInningsState(
      initialState.inningsNumber,
      initialState.battingTeamId,
      initialState.bowlingTeamId,
      deliveries[0]?.strikerId ?? initialState.strikerId,
      deliveries[0]?.nonStrikerId ?? initialState.nonStrikerId,
      deliveries[0]?.bowlerId ?? initialState.currentBowlerId,
      Object.values(initialState.batterStats).map(b => ({ id: b.playerId, name: b.name }))
    ),
  };

  for (const d of deliveries) {
    const input = getInput(d);
    const bowlerName = getBowlerName(d.bowlerId);
    const replacementName = d.wicket?.replacementBatterId
      ? getPlayerName(d.wicket.replacementBatterId)
      : undefined;
    state = applyDelivery(state, input, bowlerName, replacementName, getPlayerName);
  }

  return state;
}
