import { SpeedDungeonGame } from "./index.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export function getCombatantInGameById(
  game: SpeedDungeonGame,
  entityId: string
): Error | Combatant {
  for (const party of Object.values(game.adventuringParties)) {
    const combatantOption = party.combatantManager.getCombatantOption(entityId);
    const combatantWasFound = combatantOption !== undefined;
    if (combatantWasFound) return combatantOption;
  }

  return new Error(`${ERROR_MESSAGES.COMBATANT.NOT_FOUND}: Entity Id: ${entityId}`);
}
