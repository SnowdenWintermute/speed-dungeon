import cloneDeep from "lodash.clonedeep";
import { AdventuringParty } from ".";
import { CombatantDetails } from "../combatants";
import { ERROR_MESSAGES } from "../errors";

export default function getCombatant(
  this: AdventuringParty,
  entityId: string
): Error | CombatantDetails {
  const matchedCharacterOption = this.characters[entityId];
  if (matchedCharacterOption) {
    return {
      entityProperties: matchedCharacterOption.entityProperties,
      combatantProperties: cloneDeep(matchedCharacterOption.combatantProperties),
    };
  }
  const matchedMonsterOption = this.currentRoom.monsters[entityId];
  if (matchedMonsterOption) {
    return {
      entityProperties: matchedMonsterOption.entityProperties,
      combatantProperties: matchedMonsterOption.combatantProperties,
    };
  }

  return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
}
