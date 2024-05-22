import { AdventuringParty } from ".";
import { CombatantProperties } from "../combatants/combatant-properties";
import { ERROR_MESSAGES } from "../errors";
import { EntityProperties } from "../primatives";

export type CombatantDetails = {
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
};

export default function getCombatant(
  this: AdventuringParty,
  entityId: string
): Error | CombatantDetails {
  const matchedCharacterOption = this.characters[entityId];
  if (matchedCharacterOption) {
    return {
      entityProperties: matchedCharacterOption.entityProperties,
      combatantProperties: matchedCharacterOption.combatantProperties,
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
