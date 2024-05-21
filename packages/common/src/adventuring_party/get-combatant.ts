import { AdventuringParty } from ".";
import { CombatantProperties } from "../combatants/combatant-properties";
import { EntityProperties } from "../primatives";

export default function getCombatant(
  this: AdventuringParty,
  entityId: string
): undefined | [EntityProperties, CombatantProperties] {
  const matchedCharacterOption = this.characters[entityId];
  if (matchedCharacterOption) {
    return [matchedCharacterOption.entityProperties, matchedCharacterOption.combatantProperties];
  }
  const matchedMonsterOption = this.currentRoom.monsters[entityId];
  if (matchedMonsterOption) {
    return [matchedMonsterOption.entityProperties, matchedMonsterOption.combatantProperties];
  }
}
