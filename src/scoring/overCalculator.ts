// ============================================================
// Over & Legal Ball Calculator
// ============================================================

import type { Delivery, InningsState, OverSummary } from './types';

/**
 * Returns true if this delivery counts as a legal ball.
 * Wides and no-balls do NOT count as legal deliveries.
 */
export function isLegalDelivery(d: Delivery): boolean {
  return !d.isWide && !d.isNoBall;
}

/**
 * Convert legal ball count to display string.
 * 0 → "0.0", 6 → "1.0", 7 → "1.1"
 */
export function legalBallsToOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

/**
 * Determine what over (0-indexed) and ball-in-over (0-indexed)
 * a given cumulative legal ball number belongs to.
 */
export function legalBallToPosition(legalBalls: number): { over: number; ball: number } {
  return {
    over: Math.floor(legalBalls / 6),
    ball: legalBalls % 6,
  };
}

/**
 * Returns true if the last legal delivery just completed an over.
 * (i.e., legalBalls is a multiple of 6 and > 0)
 */
export function isOverComplete(legalBalls: number): boolean {
  return legalBalls > 0 && legalBalls % 6 === 0;
}

/**
 * Returns true if the innings should end (all overs used).
 */
export function isInningsOver(legalBalls: number, oversPerInnings: number): boolean {
  return legalBalls >= oversPerInnings * 6;
}

/**
 * Get a display string for the current over deliveries.
 * Returns strings like '0', '1', '4', '6', 'W', 'wd', 'nb', 'nb+1'
 */
export function getBallDisplayString(d: Delivery): string {
  if (d.isWicket && d.wicket && !d.wicket.isRetiredHurt) {
    if (d.isNoBall) return 'nb+W';
    return 'W';
  }
  if (d.isWide) {
    const extra = d.extraRuns - 1; // subtract wide penalty
    return extra > 0 ? `wd+${extra}` : 'wd';
  }
  if (d.isNoBall) {
    const runs = d.batterRuns + (d.extraRuns > 1 ? d.extraRuns - 1 : 0);
    return runs > 0 ? `nb+${runs}` : 'nb';
  }
  if (d.isBye) {
    return `b${d.extraRuns}`;
  }
  if (d.isLegBye) {
    return `lb${d.extraRuns}`;
  }
  return String(d.batterRuns);
}

/**
 * Build the OverSummary for a completed over from its deliveries.
 */
export function buildOverSummary(
  deliveries: Delivery[],
  overNumber: number,
  bowlerId: string,
  bowlerName: string
): OverSummary {
  let runs = 0;
  let wickets = 0;
  let wides = 0;
  let noBalls = 0;
  let batterRuns = 0;

  const balls: string[] = [];

  for (const d of deliveries) {
    runs += d.totalRunsScored;
    if (d.isWide) wides++;
    if (d.isNoBall) noBalls++;
    if (d.isWicket && d.wicket && !d.wicket.isRetiredHurt) wickets++;
    if (!d.isWide && !d.isNoBall) batterRuns += d.batterRuns;
    balls.push(getBallDisplayString(d));
  }

  // A maiden over: 6 legal deliveries, 0 runs attributed to bat (byes/legbyes still count)
  const legalDeliveries = deliveries.filter(d => !d.isWide && !d.isNoBall);
  const isMaiden = legalDeliveries.length === 6 && batterRuns === 0 && wides === 0 && noBalls === 0;

  return { overNumber, bowlerId, bowlerName, runs, wickets, wides, noBalls, isMaiden, balls };
}

/**
 * Check if a bowler is eligible to bowl the next over.
 * - Cannot bowl consecutive overs
 * - Cannot exceed maxOversPerBowler
 */
export function isBowlerEligible(
  bowlerId: string,
  innings: InningsState,
  maxOversPerBowler: number,
  lastOverBowlerId?: string
): boolean {
  // Cannot bowl consecutive overs
  if (lastOverBowlerId && bowlerId === lastOverBowlerId) return false;

  // Check max overs
  const bowlerStat = innings.bowlerStats[bowlerId];
  if (!bowlerStat) return true;
  const oversCompleted = Math.floor(bowlerStat.legalBalls / 6);
  return oversCompleted < maxOversPerBowler;
}

/**
 * Compute current run rate.
 */
export function computeCRR(runs: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  return (runs / legalBalls) * 6;
}

/**
 * Compute required run rate.
 */
export function computeRRR(runsRequired: number, ballsRemaining: number): number {
  if (ballsRemaining <= 0) return 0;
  return (runsRequired / ballsRemaining) * 6;
}
