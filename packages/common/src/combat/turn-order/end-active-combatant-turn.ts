import { CombatantTurnTracker } from "./index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { REQUIRED_MOVEMENT_TO_MOVE } from "./consts.js";

export default function endActiveCombatantTurn(
  game: SpeedDungeonGame,
  battleId: string
): Error | CombatantTurnTracker {
  const battleOption = game.battles[battleId];
  if (battleOption === undefined)
    return new Error(
      `${ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST} (id: ${JSON.stringify(battleId)})`
    );
  const battle = battleOption;

  const tickResult = SpeedDungeonGame.tickCombatUntilNextCombatantIsActive(game, battle.id);
  if (tickResult instanceof Error) return tickResult;
  const activeCombatantTurnTrackerOption = battle.turnTrackers[0];
  if (!activeCombatantTurnTrackerOption)
    return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);
  const activeCombatantTurnTracker = activeCombatantTurnTrackerOption;
  activeCombatantTurnTracker.movement -= REQUIRED_MOVEMENT_TO_MOVE;

  battle.turnTrackers = battle.turnTrackers.sort((a, b) => {
    if (Math.floor(a.movement) !== Math.floor(b.movement)) return b.movement - a.movement;
    return parseInt(a.entityId) - parseInt(b.entityId);
  });

  const newActiveCombatantTrackerOption = battle.turnTrackers[0];
  if (!newActiveCombatantTrackerOption) return new Error(ERROR_MESSAGES.BATTLE.TURN_TRACKERS_EMPTY);
  return newActiveCombatantTrackerOption;
}
