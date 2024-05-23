import { SpeedDungeonGame } from ".";
import { CombatantDetails } from "../combatants";
import { ERROR_MESSAGES } from "../errors";

export default function getCombatantById(
  this: SpeedDungeonGame,
  entityId: string
): Error | CombatantDetails {
  for (let party of Object.values(this.adventuringParties)) {
    const combatantResult = party.getCombatant(entityId);
    if (!(combatantResult instanceof Error)) return combatantResult;
  }

  return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
}
