// ============================================================
// Innings Calculator
// ============================================================

import type { InningsState, MatchState, MatchResult } from './types';
import { computeCRR, computeRRR, legalBallsToOvers } from './overCalculator';

/**
 * Target for second innings = first innings total + 1.
 */
export function calculateTarget(firstInningsRuns: number): number {
  return firstInningsRuns + 1;
}

/**
 * Runs required for second innings to win.
 */
export function calculateRunsRequired(target: number, currentRuns: number): number {
  return Math.max(0, target - currentRuns);
}

/**
 * Legal balls remaining in the innings.
 */
export function calculateBallsRemaining(totalOvers: number, legalBalls: number): number {
  return Math.max(0, totalOvers * 6 - legalBalls);
}

/**
 * Wickets remaining.
 */
export function calculateWicketsRemaining(playersPerTeam: number, wickets: number): number {
  return Math.max(0, playersPerTeam - 1 - wickets);
}

export interface ChaseInfo {
  target: number;
  runsRequired: number;
  ballsRemaining: number;
  wicketsRemaining: number;
  rrr: number;
  crr: number;
}

export function getChaseInfo(
  firstInnings: InningsState,
  secondInnings: InningsState,
  totalOvers: number,
  playersPerTeam: number
): ChaseInfo {
  const target = calculateTarget(firstInnings.totalRuns);
  const runsRequired = calculateRunsRequired(target, secondInnings.totalRuns);
  const ballsRemaining = calculateBallsRemaining(totalOvers, secondInnings.legalBalls);
  const wicketsRemaining = calculateWicketsRemaining(playersPerTeam, secondInnings.wickets);
  const rrr = computeRRR(runsRequired, ballsRemaining);
  const crr = computeCRR(secondInnings.totalRuns, secondInnings.legalBalls);
  return { target, runsRequired, ballsRemaining, wicketsRemaining, rrr, crr };
}

/**
 * Determine if a match result has been reached.
 */
export function determineMatchResult(match: MatchState): MatchResult | null {
  const innings1 = match.innings[0];
  const innings2 = match.innings[1];

  if (!innings1) return null;

  // If only first innings played, no result yet unless all out / overs up
  if (!innings2) return null;

  const target = calculateTarget(innings1.totalRuns);
  const maxBalls = match.rules.oversPerInnings * 6;
  const maxWickets = match.rules.playersPerTeam - 1;
  const battingTeam = match.teams[innings2.battingTeamId];
  const bowlingTeam = match.teams[innings2.bowlingTeamId];

  // Second innings team won (chased target)
  if (innings2.totalRuns >= target) {
    const wicketsRemaining = maxWickets - innings2.wickets;
    return {
      winnerId: innings2.battingTeamId,
      winnerName: battingTeam?.name,
      margin: `${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`,
      resultType: 'win',
      description: `${battingTeam?.name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`,
    };
  }

  // All out or overs up in second innings
  if (innings2.wickets >= maxWickets || innings2.legalBalls >= maxBalls) {
    const diff = innings1.totalRuns - innings2.totalRuns;

    if (diff === 0) {
      return {
        resultType: 'tie',
        margin: 'Tied',
        description: 'Match tied',
      };
    }

    if (diff > 0) {
      return {
        winnerId: innings1.battingTeamId,
        winnerName: bowlingTeam?.name,
        margin: `${diff} run${diff !== 1 ? 's' : ''}`,
        resultType: 'win',
        description: `${bowlingTeam?.name} won by ${diff} run${diff !== 1 ? 's' : ''}`,
      };
    }
  }

  return null;
}

/**
 * Get a summary display string for innings.
 * e.g. "87/3 (9.4)"
 */
export function getInningsDisplay(innings: InningsState): string {
  return `${innings.totalRuns}/${innings.wickets} (${legalBallsToOvers(innings.legalBalls)})`;
}
