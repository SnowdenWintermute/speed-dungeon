import { AdventuringParty } from "./index.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export default function getCombatantInParty(
  party: AdventuringParty,
  entityId: string
): Error | Combatant {
  const matchedCharacterOption = party.characters[entityId];
  if (matchedCharacterOption) return matchedCharacterOption;

  const matchedSummonedCharacterPetOption = party.petManager.getSummonedPetOptionById(entityId);
  if (matchedSummonedCharacterPetOption) return matchedSummonedCharacterPetOption;

  const matchedMonsterOption = party.currentRoom.monsters[entityId];
  if (matchedMonsterOption) return matchedMonsterOption;

  return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
}
