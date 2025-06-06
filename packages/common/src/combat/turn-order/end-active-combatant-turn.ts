import { CombatantTurnTracker } from "./index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { REQUIRED_MOVEMENT_TO_MOVE } from "./consts.js";
import { Battle } from "../../battle/index.js";

export function endActiveCombatantTurn(
  game: SpeedDungeonGame,
  battle: Battle
): Error | CombatantTurnTracker {
  const tickResult = SpeedDungeonGame.tickCombatUntilNextCombatantIsActive(game, battle.id);
  if (tickResult instanceof Error) return tickResult;
  const activeCombatantTurnTrackerOption = battle.turnTrackers[0];
  if (!activeCombatantTurnTrackerOption)
    return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);
  const activeCombatantTurnTracker = activeCombatantTurnTrackerOption;
  activeCombatantTurnTracker.movement -= REQUIRED_MOVEMENT_TO_MOVE;

  battle.turnTrackers = Battle.sortTurnTrackers(battle);

  const newActiveCombatantTrackerOption = battle.turnTrackers[0];
  if (!newActiveCombatantTrackerOption) return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);
  return newActiveCombatantTrackerOption;
}
