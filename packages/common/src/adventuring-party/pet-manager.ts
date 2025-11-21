import { AdventuringParty } from "./index.js";
import { MAXIMUM_PET_SLOTS } from "../app-consts.js";
import { Combatant } from "../combatants/index.js";
import { EntityId } from "../primatives/index.js";
import { Battle } from "../battle/index.js";
import { TurnTrackerEntityType } from "../combat/index.js";

export class PetManager {
  private unsummonedPetsByOwnerId: { [ownerId: EntityId]: (Combatant | undefined)[] } = {};

  setCombatantPets(ownerId: EntityId, pets: Combatant[]) {
    this.unsummonedPetsByOwnerId[ownerId] = pets;
  }

  getUnsummonedPetOptionByOwnerAndSlot(ownerId: EntityId, petSlot: number) {
    const petOption = this.unsummonedPetsByOwnerId[ownerId]?.[petSlot];
    return petOption;
  }

  iteratePetSlots(ownerId: EntityId) {
    const toReturn = [];
    for (let slotIndex = 0; slotIndex < MAXIMUM_PET_SLOTS; slotIndex += 1) {
      toReturn.push({
        slotIndex,
        petOption: this.getUnsummonedPetOptionByOwnerAndSlot(ownerId, slotIndex),
      });
    }
    return toReturn;
  }

  getPetAndOwnerByPetId(party: AdventuringParty, petId: EntityId) {
    for (const character of party.combatantManager.getPartyMemberCharacters()) {
      const characterId = character.getEntityId();
      for (const { slotIndex, petOption } of this.iteratePetSlots(characterId)) {
        if (petId === petOption?.getEntityId()) return { pet: petOption, ownerId: characterId };
      }
    }
    throw new Error("no pet was found in the provided slot index");
  }

  private removePetFromUnsummonedSlot(ownerId: EntityId, slotIndex: number) {
    const petOption = this.unsummonedPetsByOwnerId[ownerId]?.[slotIndex];
    delete this.unsummonedPetsByOwnerId[ownerId]?.[slotIndex];
    return petOption;
  }

  private putPetInFirstEmptyUnsummonedSlot(ownerId: EntityId, pet: Combatant) {
    const ownerPetSlots = this.unsummonedPetsByOwnerId[ownerId];
    if (ownerPetSlots === undefined) {
      throw new Error("Expected to have pet slots if a pet had been summoned in this party");
    }
    const emptyIndex = ownerPetSlots.findIndex((slot) => slot === undefined);
    ownerPetSlots[emptyIndex] = pet;
  }

  unsummonPet(party: AdventuringParty, petId: EntityId) {
    const expectedPet = party.combatantManager.getExpectedCombatant(petId);
    const summonedBy = expectedPet.combatantProperties.controlledBy.summonedBy;
    if (summonedBy === undefined) {
      throw new Error("Expected a pet to have been summoned by someone");
    }
    this.putPetInFirstEmptyUnsummonedSlot(summonedBy, expectedPet);
    party.combatantManager.removeCombatant(expectedPet.getEntityId());
  }

  /** Moves the pet from the unsummoned pets storage to the summoned pets storage
   * and returns the summoned pet */
  summonPetFromSlot(
    party: AdventuringParty,
    ownerId: EntityId,
    slotIndex: number,
    battleOption: null | Battle
  ) {
    const owner = party.combatantManager.getExpectedCombatant(ownerId);
    const ownerHomePosition = owner.getHomePosition();

    // figure out if the pet is owned by character or monster
    const isCharacterPet = owner.combatantProperties.controlledBy.isPlayerControlled();
    const isMonsterPet = owner.combatantProperties.controlledBy.isDungeonControlled();

    // remove the pet from the unsummonedPets data structure
    const petOption = this.removePetFromUnsummonedSlot(ownerId, slotIndex);
    if (petOption === undefined)
      throw new Error(
        `expected pet owner id ${ownerId} to have a pet in that slotIndex ${slotIndex} to summon`
      );

    const pet = petOption;
    pet.combatantProperties.controlledBy.summonedBy = ownerId;

    // place the pet in either summonedCharacterPets or currentRoom.summonedMonsterPets
    if (isCharacterPet) {
      party.combatantManager.addCombatant(pet);
    } else if (isMonsterPet) {
      throw new Error("not implemented");
    }

    // @TODO - add pet home positions to updateHomePositions function
    // then just call updateHomePositions()

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
}
