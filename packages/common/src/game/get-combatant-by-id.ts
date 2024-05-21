import { SpeedDungeonGame } from ".";
import { CombatantProperties } from "../combatants/combatant-properties";
import { ERROR_MESSAGES } from "../errors";
import { EntityProperties } from "../primatives";

export default function getCombatantById(
  this: SpeedDungeonGame,
  entityId: string
): Error | [EntityProperties, CombatantProperties] {
  for (let party of Object.values(this.adventuringParties)) {
    const combatantResult = party.getCombatant(entityId);
    if (!(combatantResult instanceof Error)) return combatantResult;
  }

  return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
}
