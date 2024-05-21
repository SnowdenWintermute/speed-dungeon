import { SpeedDungeonGame } from ".";
import { CombatantProperties } from "../combatants/combatant-properties";
import { EntityProperties } from "../primatives";

export default function getCombatantById(
  this: SpeedDungeonGame,
  entityId: string
): undefined | [EntityProperties, CombatantProperties] {
  let toReturn: undefined | [EntityProperties, CombatantProperties] = undefined;
  Object.values(this.adventuringParties).forEach((party) => {
    toReturn = party.getCombatant(entityId);
    if (toReturn) return;
  });

  return toReturn;
}
