import { AdventuringParty } from "./index.js";
import { MAXIMUM_PET_SLOTS } from "../app-consts.js";
import { Combatant } from "../combatants/index.js";
import { CombatantId, EntityId, Username } from "../aliases.js";
import { Battle } from "../battle/index.js";
import { AdventuringPartySubsystem } from "./party-subsystem.js";
import { SpeedDungeonGame } from "../game/index.js";
import { CombatantControllerType } from "../combatants/combatant-controllers.js";
import { CombatantConditionName } from "../conditions/condition-names.js";
import { Serializable, SerializedOf } from "../serialization/index.js";
import { MapUtils } from "../utils/map-utils.js";

export class PetManager extends AdventuringPartySubsystem implements Serializable {
  private unsummonedPetsByOwnerId = new Map<EntityId, (Combatant | undefined)[]>();

  toSerialized() {
    return {
      unsummonedPetsByOwnerId: MapUtils.serialize(this.unsummonedPetsByOwnerId, (v) =>
        v.map((pet) => pet?.toSerialized())
      ),
    };
  }

  static fromSerialized(serialized: SerializedOf<PetManager>) {
    const result = new PetManager();
    result.unsummonedPetsByOwnerId = MapUtils.deserialize(serialized.unsummonedPetsByOwnerId, (v) =>
      v.map((serializedPet) =>
        serializedPet ? Combatant.fromSerialized(serializedPet) : undefined
      )
    );
    return result;
  }

  getAllPetsByOwnerId(ownerId: EntityId) {
    const unsummoned = this.iteratePetSlots(ownerId)
      .map((petSlot) => petSlot.petOption)
      .filter((petOption): petOption is Combatant => petOption !== undefined);
    const summonedOption = this.getCombatantSummonedPetOption(ownerId);

    const allPets = [...unsummoned];

    if (summonedOption !== undefined) {
      allPets.push(summonedOption);
    }

    return allPets;
  }

  setCombatantPets(ownerId: EntityId, pets: Combatant[]) {
    this.unsummonedPetsByOwnerId.set(ownerId, pets);
  }

  clearCombatantPets(ownerId: EntityId) {
    this.unsummonedPetsByOwnerId.delete(ownerId);
  }

  getUnsummonedPetOptionByOwnerAndSlot(ownerId: EntityId, petSlot: number) {
    const petOption = this.unsummonedPetsByOwnerId.get(ownerId)?.[petSlot];
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

  getOwnerOccupiedPetSlotsCount(ownerId: EntityId) {
    return this.iteratePetSlots(ownerId).filter((slot) => slot.petOption !== undefined).length;
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
    const petOption = this.unsummonedPetsByOwnerId.get(ownerId)?.[slotIndex];
    delete this.unsummonedPetsByOwnerId.get(ownerId)?.[slotIndex];
    return petOption;
  }

  putPetInFirstEmptyUnsummonedSlot(ownerId: EntityId, pet: Combatant) {
    let ownerPetSlots = this.unsummonedPetsByOwnerId.get(ownerId);
    if (ownerPetSlots === undefined) {
      // possible if taming a pet before summoning one
      this.unsummonedPetsByOwnerId.set(ownerId, []);
      ownerPetSlots = [];
    }
    const emptyIndex = ownerPetSlots.findIndex((slot) => slot === undefined);
    if (emptyIndex === -1) {
      ownerPetSlots.push(pet);
    } else {
      ownerPetSlots[emptyIndex] = pet;
    }
  }

  /** returns the dismissed pet */
  unsummonPet(petId: EntityId, game: SpeedDungeonGame) {
    const party = this.getParty();
    const expectedPet = party.combatantManager.getExpectedCombatant(petId);
    const summonedBy = expectedPet.combatantProperties.controlledBy.summonedBy;
    if (summonedBy === undefined) {
      throw new Error("Expected a pet to have been summoned by someone");
    }
    this.putPetInFirstEmptyUnsummonedSlot(summonedBy, expectedPet);
    party.combatantManager.removeCombatant(expectedPet.getEntityId(), game);
    return expectedPet;
  }

  /** Moves the pet from the unsummoned pets storage to the summoned pets storage
   * and returns the summoned pet */
  summonPetFromSlot(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    ownerId: EntityId,
    slotIndex: number,
    withDelay?: number
  ) {
    const owner = party.combatantManager.getExpectedCombatant(ownerId);

    // figure out if the pet is owned by character or monster
    const isCharacterPet = owner.combatantProperties.controlledBy.isPlayerControlled();
    const isMonsterPet = owner.combatantProperties.controlledBy.isDungeonControlled();

    // remove the pet from the unsummonedPets data structure
    const petOption = this.removePetFromUnsummonedSlot(ownerId, slotIndex);
    if (petOption === undefined) {
      return undefined;
    }

    // remove ensnared since the net usually removes it on death but if the net is gone
    // that would be a problem since it would never die and never remove the net
    petOption.combatantProperties.conditionManager.removeConditionByName(
      CombatantConditionName.Ensnared
    );

    const pet = petOption;
    pet.combatantProperties.controlledBy.summonedBy = ownerId;

    // place the pet in either summonedCharacterPets or currentRoom.summonedMonsterPets
    if (isCharacterPet) {
      party.combatantManager.addCombatant(pet, game, withDelay);
    } else if (isMonsterPet) {
      throw new Error("not implemented");
    }

    party.combatantManager.setPetHomePositionNextTo(petOption, owner);
    petOption.combatantProperties.transformProperties.setToHomeTransform();

    if (party.battleId) {
      pet.combatantProperties.resources.refillActionPoints();
    }

    return pet;
  }

  releasePetInSlot(ownerId: EntityId, slotIndex: number) {
    this.removePetFromUnsummonedSlot(ownerId, slotIndex);
  }

  getCombatantSummonedPetOption(combatantId: EntityId) {
    const pets = this.getParty().combatantManager.getPartyMemberPets();
    return pets.filter((pet) => pet.combatantProperties.controlledBy.summonedBy === combatantId)[0];
  }

  handlePetTamed(petId: CombatantId, newOwnerId: CombatantId, game: SpeedDungeonGame) {
    const party = this.getParty();
    const petCombatant = party.combatantManager.removeCombatant(petId, game);

    petCombatant.combatantProperties.threatManager = undefined;
    party.combatantManager.updateHomePositions();
    const newOwner = party.combatantManager.getExpectedCombatant(newOwnerId);
    party.combatantManager.setPetHomePositionNextTo(petCombatant, newOwner);
    const { controlledBy } = petCombatant.combatantProperties;
    controlledBy.controllerType = CombatantControllerType.PlayerPetAI;
    controlledBy.controllerPlayerName =
      newOwner.combatantProperties.controlledBy.controllerPlayerName;

    this.putPetInFirstEmptyUnsummonedSlot(newOwnerId, petCombatant);
  }
}
