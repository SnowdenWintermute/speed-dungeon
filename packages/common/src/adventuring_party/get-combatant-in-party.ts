import { AdventuringParty } from "./index.js";
import { CombatantDetails } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export default function getCombatantInParty(
  party: AdventuringParty,
  entityId: string
): Error | CombatantDetails {
  const matchedCharacterOption = party.characters[entityId];
  if (matchedCharacterOption) {
    return {
      entityProperties: matchedCharacterOption.entityProperties,
      combatantProperties: matchedCharacterOption.combatantProperties,
    };
  }
  const matchedMonsterOption = party.currentRoom.monsters[entityId];
  if (matchedMonsterOption) {
    return {
      entityProperties: matchedMonsterOption.entityProperties,
      combatantProperties: matchedMonsterOption.combatantProperties,
    };
  }

  return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
}
