import { Battle } from "../battle/index.js";
import { EntityId } from "../primatives/index.js";
import { AdventuringParty } from "./index.js";

export function handleSummonPet(
  party: AdventuringParty,
  petId: EntityId,
  battleOption: null | Battle
) {
  const { pet, ownerId } = party.getPetAndOwnerByPetId(petId);
  // figure out if the pet is owned by character or monster
  // remove the pet from the unsummonedPets data structure
  // place the pet in either summonedCharacterPets or currentRoom.summonedMonsterPets
  // determine where to position the pet
  // set its home position
}
