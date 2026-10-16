// ============================================================
// Strike Calculator
// ============================================================
// Pure functions that determine who is on strike after each delivery.
// These are kept separate from the scoring engine to keep them testable.

import type { Delivery } from './types';

/**
 * Determine whether strike swaps at the END OF AN OVER.
 * After a completed over, the striker becomes the non-striker for the next over.
 * Exception: if the last legal delivery was a wicket and the dismissed batter was the striker,
 *            the new batter will come in and the appropriate end-of-over logic applies.
 *
 * We handle this by simply always swapping at end-of-over after all deliveries are processed.
 * This is called AFTER processDelivery has already updated the live strike within the over.
 */
export function applyEndOfOverStrikeSwap(strikerId: string, nonStrikerId: string): [string, string] {
  return [nonStrikerId, strikerId];
}

/**
 * Determine striker/non-striker AFTER a single delivery, within an over.
 *
 * Rules:
 *  1. If it's a wicket (not retired hurt), the replacement batter comes in as the non-striker
 *     (the surviving batter's position is preserved). Then check if runs scored cause a swap.
 *  2. Odd completed runs (by bat) → swap
 *  3. Even completed runs → no swap
 *  4. Wide: completed additional runs (odd → swap, even → no swap)
 *  5. Bye / Leg-bye: treat the TOTAL runs (byes) for swap purposes, not batter runs
 *  6. No-ball: batter runs used for swap, as per standard rules
 *  7. Free-hit no-ball run-out: only non-striker can be run out (if dismissed batter is non-striker, swap)
 */
export function calculateStrikeAfterDelivery(
  delivery: Omit<Delivery, 'strikerAfter' | 'nonStrikerAfter'>,
  strikerId: string,
  nonStrikerId: string,
  replacementBatterId?: string
): { strikerAfter: string; nonStrikerAfter: string } {
  let currentStriker = strikerId;
  let currentNonStriker = nonStrikerId;

  // Handle wicket first
  if (delivery.isWicket && delivery.wicket) {
    const { dismissedBatterId, isRetiredHurt } = delivery.wicket;

    if (!isRetiredHurt && replacementBatterId) {
      // Dismissed batter is replaced
      if (dismissedBatterId === currentStriker) {
        // Striker dismissed – replacement comes in as striker
        currentStriker = replacementBatterId;
        // currentNonStriker stays
      } else {
        // Non-striker dismissed (run-out) – replacement comes in as non-striker
        currentNonStriker = replacementBatterId;
        // currentStriker stays
      }
    }
  }

  // Calculate runs for strike-rotation purposes
  let runsForSwap = 0;

  if (delivery.isWide) {
    // On a wide, only additional completed runs count for swap
    // extraRuns includes the wide penalty (1), so subtract it
    runsForSwap = delivery.totalRunsScored - delivery.extraRuns + (delivery.extraRuns > 1 ? delivery.extraRuns - 1 : 0);
    // Actually: on a wide, runs from running are the completed runs
    // Wide penalty doesn't change strike. Batting/running runs do.
    runsForSwap = delivery.batterRuns + Math.max(0, delivery.extraRuns - 1);
  } else if (delivery.isBye || delivery.isLegBye) {
    // Byes/leg-byes: TOTAL runs scored determine strike swap
    runsForSwap = delivery.totalRunsScored;
  } else {
    // Normal, no-ball: batter runs determine swap
    runsForSwap = delivery.batterRuns;
    // On a no-ball, the extra penalty (1) does NOT affect strike rotation
  }

  // Odd runs → swap
  if (runsForSwap % 2 === 1) {
    [currentStriker, currentNonStriker] = [currentNonStriker, currentStriker];
  }

  return { strikerAfter: currentStriker, nonStrikerAfter: currentNonStriker };
}
