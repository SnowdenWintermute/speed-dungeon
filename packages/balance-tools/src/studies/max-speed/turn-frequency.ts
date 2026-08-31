import { BASE_ACTION_DELAY_MULTIPLIER, TurnOrderManager } from "@speed-dungeon/common";

/** shares of the character's own speed to weigh it against, slower ones first */
export const COMPARISON_SPEED_SHARES = [0.25, 0.5, 0.75, 1.5, 2];

export function actionDelayCostAtSpeed(speed: number) {
  return TurnOrderManager.getActionDelayCost(speed, BASE_ACTION_DELAY_MULTIPLIER);
}

/** floored, since the speed a combatant is compared against is one it could actually have */
export function comparisonSpeed(speed: number, share: number) {
  return Math.floor(speed * share);
}

/**
 * Turns this speed takes for every one the other takes. Exact rather than simulated: a scheduler's
 * time of next move advances by its delay cost every turn, so turns up to any time are that time
 * over the delay, and the ratio is the delays swapped. The delay cost is clamped to at least one,
 * so only a speed of zero — which really does mean never moving — leaves the ordinary division.
 */
export function turnsPerOpponentTurn(speed: number, opponentSpeed: number) {
  const delay = actionDelayCostAtSpeed(speed);
  const opponentDelay = actionDelayCostAtSpeed(opponentSpeed);

  if (!Number.isFinite(delay)) {
    return 0;
  }
  if (!Number.isFinite(opponentDelay)) {
    return Infinity;
  }
  return opponentDelay / delay;
}
