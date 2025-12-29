import { CombatantProperties } from "../../combatants/combatant-properties.js";
import { Combatant } from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CharacterSlotIndex, EntityId, EntityName } from "../../aliases.js";

export interface CharacterInSlot {
  combatant: Combatant;
  pets: Combatant[];
}

type SlotIndex = number;
type SavedCharacterSlots = Record<SlotIndex, CharacterInSlot>;

export interface CharacterSlot {
  id: string;
  profileId: number;
  slotNumber: CharacterSlotIndex;
  characterId: null | EntityId;
  createdAt: number | Date;
  updatedAt: number | Date;
}

export interface SerializedPlayerCharacter {
  id: EntityId;
  name: EntityName;
  ownerId: number;
  gameVersion: string;
  combatantProperties: CombatantProperties;
  createdAt: number | Date;
  updatedAt: number | Date;
  pets: Combatant[];
}

export interface SavedCharacterPersistenceStrategy {
  fetchCharacter: (characterId: EntityId) => Promise<SerializedPlayerCharacter>;
  insert: (
    combatant: Combatant,
    pets: Combatant[],
    ownerId: number
  ) => Promise<SerializedPlayerCharacter>;
  update: (combatant: Combatant, pets: Combatant[]) => Promise<SerializedPlayerCharacter>;
  delete: (id: number | string) => Promise<SerializedPlayerCharacter>;
}

export interface SavedCharacterSlotsPersistenceStrategy {
  fetchSlots: (profileId: number) => Promise<CharacterSlot[]>;
  update: (characterSlot: CharacterSlot) => Promise<CharacterSlot>;
}

export class SavedCharactersService {
  constructor(
    private readonly savedCharacterSlotsPersistenceStrategy: SavedCharacterSlotsPersistenceStrategy,
    private readonly savedCharacterPersistenceStrategy: SavedCharacterPersistenceStrategy
  ) {}

  async fetchSavedCharacters(profileId: number): Promise<SavedCharacterSlots> {
    const slots = await this.savedCharacterSlotsPersistenceStrategy.fetchSlots(profileId);
    if (slots === undefined) {
      throw new Error("No character slots found");
    }

    const toReturn: SavedCharacterSlots = {};
    const characterPromises: Promise<void>[] = [];

    for (const slot of slots) {
      const { characterId } = slot;
      if (characterId === null) {
        continue;
      }

      characterPromises.push(
        (async () => {
          const characterInSlot = await this.fetchSavedCharacter(characterId);
          toReturn[slot.slotNumber] = characterInSlot;
        })()
      );
    }

    await Promise.all(characterPromises);

    return toReturn;
  }

  async fetchSavedCharacter(characterId: EntityId): Promise<CharacterInSlot> {
    const character = await this.savedCharacterPersistenceStrategy.fetchCharacter(characterId);

    if (character === undefined) {
      throw new Error("Character slot was holding an id that didn't match any character");
    }

    const deserializedCombatantProperties = CombatantProperties.getDeserialized(
      character.combatantProperties
    );

    const combatant = Combatant.createInitialized(
      { id: character.id, name: character.name },
      deserializedCombatantProperties
    );

    const deserializedPets: Combatant[] = [];
    for (const pet of character.pets) {
      const deserializedPet = Combatant.getDeserialized(pet);
      deserializedPets.push(deserializedPet);
    }

    return { combatant, pets: deserializedPets };
  }

  async requireEmptySlot(profileId: number, slotIndex: SlotIndex) {
    const slots = await this.savedCharacterSlotsPersistenceStrategy.fetchSlots(profileId);
    const slotOption = slots[slotIndex];

    if (slotOption === undefined) {
      throw new Error("Expected character slot missing");
    }

    const slotIsFilled = slotOption.characterId !== null;
    if (slotIsFilled) {
      throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_FULL);
    }

    return slotOption;
  }

  async requireSlotWithCharacterId(profileId: number, characterId: EntityId) {
    const slots = await this.savedCharacterSlotsPersistenceStrategy.fetchSlots(profileId);
    for (const slot of slots) {
      if (slot.characterId === characterId) {
        return slot;
      }
    }

    throw new Error("Expected character slot missing");
  }

  async saveCharacterInSlot(
    slot: CharacterSlot,
    newCharacter: Combatant,
    pets: Combatant[],
    userId: number
  ) {
    await this.savedCharacterPersistenceStrategy.insert(newCharacter, pets, userId);
    slot.characterId = newCharacter.entityProperties.id;
    await this.savedCharacterSlotsPersistenceStrategy.update(slot);
  }

  async deleteCharacterInSlot(characterId: EntityId, slot: CharacterSlot) {
    await this.savedCharacterPersistenceStrategy.delete(characterId);
    slot.characterId = null;
    await this.savedCharacterSlotsPersistenceStrategy.update(slot);
  }

  static getLivingCharacterInSlotsById(entityId: EntityId, slots: SavedCharacterSlots) {
    let savedCharacterOption: undefined | CharacterInSlot;
    for (const character of Object.values(slots)) {
      if (character.combatant.entityProperties.id === entityId) {
        if (character.combatant.combatantProperties.isDead()) {
          throw new Error(ERROR_MESSAGES.COMBATANT.IS_DEAD);
        }

        savedCharacterOption = character;
        break;
      }
    }

    if (savedCharacterOption === undefined) {
      throw new Error(ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_OWNED);
    }

    return savedCharacterOption;
  }
}
