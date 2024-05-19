import { SpeedDungeonGame } from ".";
import { CombatantProperties } from "../combatants/combatant-properties";
import { EntityProperties } from "../primatives";

export default function getCombatantById(
  this: SpeedDungeonGame,
  entityId: string
): null | [EntityProperties, CombatantProperties] {
  let toReturn: null | [EntityProperties, CombatantProperties] = null;
  Object.values(this.adventuringParties).forEach((party) => {
    const matchedCharacterOption = party.characters[entityId];
    if (matchedCharacterOption) {
      toReturn = [
        matchedCharacterOption.entityProperties,
        matchedCharacterOption.combatantProperties,
      ];
      return;
    }
    const matchedMonsterOption = party.currentRoom.monsters[entityId];
    if (matchedMonsterOption) {
      toReturn = [matchedMonsterOption.entityProperties, matchedMonsterOption.combatantProperties];
      return;
    }
    if (toReturn !== null) return;
  });

  return toReturn;
}
