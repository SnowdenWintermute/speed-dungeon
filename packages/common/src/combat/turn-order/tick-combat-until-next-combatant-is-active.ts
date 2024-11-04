import { CombatantTurnTracker } from "./index.js";
import { CombatAttribute, CombatantProperties } from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import {
  MIN_MOVEMENT_PER_TICK,
  MIN_SPEED,
  MOVEMENT_RANGE,
  REQUIRED_MOVEMENT_TO_MOVE,
  SPEED_MODIFIER,
  SPEED_RANGE,
} from "./consts.js";
import { Battle } from "../../battle/index.js";

export function tickCombatUntilNextCombatantIsActive(game: SpeedDungeonGame, battleId: string) {
  const battleOption = game.battles[battleId];
  if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
  const battle = battleOption;

  let activeCombatantTurnTracker = battle.turnTrackers[0];
  if (!activeCombatantTurnTracker) return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);

  // make sure someone has at least 1 speed or accumulating movement will be an infinite loop
  let atLeastOneCombatantHasNonZeroSpeed = false;
  for (const tracker of battle.turnTrackers) {
    const combatantResult = SpeedDungeonGame.getCombatantById(game, tracker.entityId);
    if (combatantResult instanceof Error) return combatantResult;
    if (
      CombatantProperties.getTotalAttributes(combatantResult.combatantProperties)[
        CombatAttribute.Speed
      ] > 0
    ) {
      atLeastOneCombatantHasNonZeroSpeed = true;
      break;
    }
  }

  if (!atLeastOneCombatantHasNonZeroSpeed) {
    return new Error(ERROR_MESSAGES.NOT_IMPLEMENTED + ": battle with no moveable entity");
    // @TODO - handle end of battle
  }

  while (activeCombatantTurnTracker.movement < REQUIRED_MOVEMENT_TO_MOVE) {
    for (const tracker of Object.values(battle.turnTrackers)) {
      const maybeError = recoverMovement(game, tracker);
      if (maybeError instanceof Error) return maybeError;
    }

    battle.turnTrackers = Battle.sortTurnTrackers(battle);

    activeCombatantTurnTracker = battle.turnTrackers[0];
    if (!activeCombatantTurnTracker) return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);
  }
}

export function recoverMovement(
  game: SpeedDungeonGame,
  tracker: CombatantTurnTracker
): Error | void {
  const combatantResult = SpeedDungeonGame.getCombatantById(game, tracker.entityId);
  if (combatantResult instanceof Error) return combatantResult;
  const { combatantProperties } = combatantResult;
  const entitySpeed =
    CombatantProperties.getTotalAttributes(combatantProperties)[CombatAttribute.Speed] || 0;
  const adjustedSpeed = entitySpeed * SPEED_MODIFIER;
  const movementToAdd =
    ((adjustedSpeed - MIN_SPEED) * MOVEMENT_RANGE) / SPEED_RANGE + MIN_MOVEMENT_PER_TICK;
  tracker.movement += movementToAdd;
}
