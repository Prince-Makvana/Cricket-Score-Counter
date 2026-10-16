import { describe, it, expect } from 'vitest';
import {
  applyDelivery,
  createInitialInningsState,
  type DeliveryInput,
} from './scoringEngine';
import { legalBallsToOvers } from './overCalculator';

describe('Cricket Scoring Engine', () => {
  const players = [
    { id: 'p1', name: 'Rohit' },
    { id: 'p2', name: 'Kohli' },
    { id: 'p3', name: 'Gill' },
    { id: 'b1', name: 'Starc' },
    { id: 'b2', name: 'Cummins' },
  ];

  function setupInnings() {
    return createInitialInningsState(
      1,
      'teamA',
      'teamB',
      'p1',
      'p2',
      'b1',
      players
    );
  }

  it('records normal legal delivery correctly', () => {
    let state = setupInnings();
    const input: DeliveryInput = {
      batterRuns: 1,
      isWide: false,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      isWicket: false,
      extraRuns: 0,
      bowlerId: 'b1',
    };

    state = applyDelivery(state, input, 'Starc', undefined, (id) => id);

    expect(state.totalRuns).toBe(1);
    expect(state.legalBalls).toBe(1);
    expect(state.wickets).toBe(0);
    // Batter stats
    expect(state.batterStats['p1'].runs).toBe(1);
    expect(state.batterStats['p1'].balls).toBe(1);
    // Strike rotated on 1 run
    expect(state.strikerId).toBe('p2');
    expect(state.nonStrikerId).toBe('p1');
    // Bowler stats
    expect(state.bowlerStats['b1'].runsConc).toBe(1);
    expect(state.bowlerStats['b1'].legalBalls).toBe(1);
  });

  it('keeps strike on boundary four (even runs)', () => {
    let state = setupInnings();
    const input: DeliveryInput = {
      batterRuns: 4,
      isWide: false,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      isWicket: false,
      extraRuns: 0,
      bowlerId: 'b1',
    };

    state = applyDelivery(state, input, 'Starc', undefined, (id) => id);

    expect(state.totalRuns).toBe(4);
    expect(state.legalBalls).toBe(1);
    expect(state.batterStats['p1'].runs).toBe(4);
    expect(state.batterStats['p1'].fours).toBe(1);
    // Strike unchanged on even runs within over
    expect(state.strikerId).toBe('p1');
    expect(state.nonStrikerId).toBe('p2');
  });

  it('does not increment legal balls on wide ball and adds penalty', () => {
    let state = setupInnings();
    const input: DeliveryInput = {
      batterRuns: 0,
      isWide: true,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      isWicket: false,
      extraRuns: 0,
      widePenalty: 1,
      bowlerId: 'b1',
    };

    state = applyDelivery(state, input, 'Starc', undefined, (id) => id);

    expect(state.totalRuns).toBe(1);
    expect(state.legalBalls).toBe(0); // MUST be 0
    expect(state.extras.wides).toBe(1);
    expect(state.extras.total).toBe(1);
    // Batter faced balls must NOT increment
    expect(state.batterStats['p1'].balls).toBe(0);
    // Bowler conceded runs
    expect(state.bowlerStats['b1'].runsConc).toBe(1);
    expect(state.bowlerStats['b1'].wides).toBe(1);
    expect(state.bowlerStats['b1'].legalBalls).toBe(0);
    // Striker remains unchanged
    expect(state.strikerId).toBe('p1');
  });

  it('handles no-ball with batter runs and triggers free-hit rule', () => {
    let state = setupInnings();
    const input: DeliveryInput = {
      batterRuns: 4,
      isWide: false,
      isNoBall: true,
      isBye: false,
      isLegBye: false,
      isWicket: false,
      extraRuns: 0,
      noBallPenalty: 1,
      freeHitEnabled: true,
      bowlerId: 'b1',
    };

    state = applyDelivery(state, input, 'Starc', undefined, (id) => id);

    // 4 from bat + 1 penalty = 5 total runs
    expect(state.totalRuns).toBe(5);
    expect(state.legalBalls).toBe(0);
    expect(state.extras.noBalls).toBe(1);
    expect(state.batterStats['p1'].runs).toBe(4);
    expect(state.batterStats['p1'].fours).toBe(1);
    expect(state.bowlerStats['b1'].runsConc).toBe(5);
    expect(state.bowlerStats['b1'].noBalls).toBe(1);
    // Next ball must be marked as free hit
    expect(state.nextFreeHit).toBe(true);
  });

  it('completes an over after exactly 6 legal deliveries and rotates strike', () => {
    let state = setupInnings();

    // Bowl 1 wide first (0 legal balls)
    state = applyDelivery(state, {
      batterRuns: 0,
      isWide: true,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      isWicket: false,
      extraRuns: 0,
      widePenalty: 1,
      bowlerId: 'b1',
    }, 'Starc', undefined, (id) => id);

    expect(state.legalBalls).toBe(0);

    // Bowl 5 dot balls (p1 remains on strike)
    for (let i = 0; i < 5; i++) {
      state = applyDelivery(state, {
        batterRuns: 0,
        isWide: false,
        isNoBall: false,
        isBye: false,
        isLegBye: false,
        isWicket: false,
        extraRuns: 0,
        bowlerId: 'b1',
      }, 'Starc', undefined, (id) => id);
    }

    expect(state.legalBalls).toBe(5);
    expect(state.overHistory.length).toBe(0);
    expect(state.strikerId).toBe('p1');

    // Bowl 6th legal ball with 0 runs
    state = applyDelivery(state, {
      batterRuns: 0,
      isWide: false,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      isWicket: false,
      extraRuns: 0,
      bowlerId: 'b1',
    }, 'Starc', undefined, (id) => id);

    expect(state.legalBalls).toBe(6);
    expect(legalBallsToOvers(state.legalBalls)).toBe('1.0');
    // Over summary must now be recorded
    expect(state.overHistory.length).toBe(1);
    expect(state.overHistory[0].overNumber).toBe(1);
    // At end of over, strike swaps! p2 is now striker
    expect(state.strikerId).toBe('p2');
    expect(state.nonStrikerId).toBe('p1');
    // Current over sequence resets
    expect(state.currentOverBalls.length).toBe(0);
  });

  it('records wicket and replaces dismissed batter correctly', () => {
    let state = setupInnings();
    const input: DeliveryInput = {
      batterRuns: 0,
      isWide: false,
      isNoBall: false,
      isBye: false,
      isLegBye: false,
      isWicket: true,
      wicket: {
        dismissalType: 'bowled',
        dismissedBatterId: 'p1',
        isRetiredHurt: false,
        replacementBatterId: 'p3',
      },
      extraRuns: 0,
      bowlerId: 'b1',
    };

    state = applyDelivery(state, input, 'Starc', 'Gill', (id) => id);

    expect(state.wickets).toBe(1);
    expect(state.legalBalls).toBe(1);
    expect(state.batterStats['p1'].isOut).toBe(true);
    expect(state.bowlerStats['b1'].wickets).toBe(1);
    // Gill (p3) replaced p1 as striker
    expect(state.strikerId).toBe('p3');
    expect(state.nonStrikerId).toBe('p2');
    // Fall of wicket recorded
    expect(state.fallOfWickets.length).toBe(1);
    expect(state.fallOfWickets[0].wicketNumber).toBe(1);
  });
});
