import { CombatAttribute, CombatantProperties } from "../../combatants";
import { ERROR_MESSAGES } from "../../errors";
import { SpeedDungeonGame } from "../../game";
import {
  MIN_MOVEMENT_PER_TICK,
  MIN_SPEED,
  MOVEMENT_RANGE,
  REQUIRED_MOVEMENT_TO_MOVE,
  SPEED_MODIFIER,
  SPEED_RANGE,
} from "./consts";

export function tickCombatUntilNextCombatantIsActive(game: SpeedDungeonGame, battleId: string) {
  const battleOption = game.battles[battleId];
  if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
  const battle = battleOption;

  battle.turnTrackers.sort((a, b) => a.movement - b.movement);
  let activeCombatantTurnTracker = battle.turnTrackers[0];
  if (!activeCombatantTurnTracker) return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);

  // @TODO - make sure someone has at least 1 speed or this will be infinite loop

  while (activeCombatantTurnTracker.movement > REQUIRED_MOVEMENT_TO_MOVE) {
    for (const tracker of Object.values(battle.turnTrackers)) {
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

    battle.turnTrackers.sort((a, b) => a.movement - b.movement);
    activeCombatantTurnTracker = battle.turnTrackers[0];
    if (!activeCombatantTurnTracker) return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);
  }
}
