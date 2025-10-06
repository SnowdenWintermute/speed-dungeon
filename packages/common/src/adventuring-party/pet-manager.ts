import { AdventuringParty } from "./index.js";
import { MAXIMUM_PET_SLOTS } from "../app-consts.js";
import { Combatant } from "../combatants/index.js";
import { EntityId } from "../primatives/index.js";
import { Battle } from "../battle/index.js";
import { TurnTrackerEntityType } from "../combat/index.js";

export class PetManager {
  private unsummonedPetsByOwnerId: { [ownerId: EntityId]: Combatant[] } = {};
  private summonedCharacterPets: Record<EntityId, Combatant> = {};

  getSummonedPetOptionById(petId: EntityId) {
    return this.summonedCharacterPets[petId];
  }

  setCombatantPets(ownerId: EntityId, pets: Combatant[]) {
    this.unsummonedPetsByOwnerId[ownerId] = pets;
  }

  getSummonedPets() {
    return this.summonedCharacterPets;
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
    for (const [entityId, combatant] of Object.entries(party.characters)) {
      for (const { slotIndex, petOption } of this.iteratePetSlots(entityId)) {
        if (petId === petOption?.getEntityId()) return { pet: petOption, ownerId: entityId };
      }
    }
    throw new Error("no pet was found in the provided slot index");
  }

  removePetFromUnsummonedSlot(ownerId: EntityId, slotIndex: number) {
    const petOption = this.unsummonedPetsByOwnerId[ownerId]?.[slotIndex];
    delete this.unsummonedPetsByOwnerId[ownerId]?.[slotIndex];
    return petOption;
  }

  /** Moves the pet from the unsummoned pets storage to the summoned pets storage
   * and returns the summoned pet */
  summonPetFromSlot(
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
    const petOption = this.removePetFromUnsummonedSlot(ownerId, slotIndex);
    if (petOption === undefined)
      throw new Error(
        `expected pet owner id ${ownerId} to have a pet in that slotIndex ${slotIndex} to summon`
      );

    const pet = petOption;

    // place the pet in either summonedCharacterPets or currentRoom.summonedMonsterPets
    if (isCharacterPet) {
      const petId = pet.getEntityId();
      this.summonedCharacterPets[petId] = pet;
      // @TODO - figure out characterPositions more generalized
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
}
