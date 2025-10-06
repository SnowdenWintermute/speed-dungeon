import { Battle } from "../battle/index.js";
import { TurnTrackerEntityType } from "../combat/index.js";
import { Combatant } from "../combatants/index.js";
import { EntityId } from "../primatives/index.js";
import { AdventuringParty } from "./index.js";

export function summonPetFromSlot(
  party: AdventuringParty,
  ownerId: EntityId,
  slotIndex: number,
  battleOption: null | Battle
) {
  const owner = AdventuringParty.getExpectedCombatant(party, ownerId);
  const ownerHomePosition = owner.getHomePosition();

  // figure out if the pet is owned by character or monster
  const isCharacterPet = party.characterPositions.includes(ownerId);
  const isMonsterPet = party.currentRoom.monsterPositions.includes(ownerId);

  // remove the pet from the unsummonedPets data structure
  const petOption = party.removePetFromUnsummonedSlot(ownerId, slotIndex);
  if (petOption === undefined)
    throw new Error(
      `expected pet owner id ${ownerId} to have a pet in that slotIndex ${slotIndex} to summon`
    );

  const pet = petOption;

  // place the pet in either summonedCharacterPets or currentRoom.summonedMonsterPets
  if (isCharacterPet) {
    const petId = pet.getEntityId();
    party.summonedCharacterPets[petId] = pet;
    party.characterPositions.push(petId);
  } else if (isMonsterPet) {
    throw new Error("not implemented");
  }

  // determine where to position the pet
  // set its home position
  const petHomePosition = pet.getHomePosition();
  petHomePosition.copyFrom(ownerHomePosition);
  petHomePosition.x -= 0.5;

  // if in battle, add its turn tracker
  if (battleOption !== null) {
    const delayOfCurrentActor =
      battleOption.turnOrderManager.getFastestActorTurnOrderTracker().timeOfNextMove;
    battleOption.turnOrderManager.turnSchedulerManager.addNewScheduler(
      {
        type: TurnTrackerEntityType.Combatant,
        combatantId: pet.entityProperties.id,
      },
      delayOfCurrentActor + 1
    );
  }

  return pet;
}

// export function getSlotIndexOfPet(party: AdventuringParty, ownerId: EntityId, petId: EntityId) {
//   const petSlots = party.unsummonedPetsByOwnerId[ownerId];
//   if (petSlots === undefined) throw new Error("no pet slots for that owner id: " + ownerId);

//   let slotIndex = -1;
//   for (const pet of petSlots) {
//     slotIndex += 1;
//     if (pet.getEntityId() === petId) return slotIndex;
//   }

//   throw new Error("pet was not found by id" + petId + " for owner " + ownerId);
// }
