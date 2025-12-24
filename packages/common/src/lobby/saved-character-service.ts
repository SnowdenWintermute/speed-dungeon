import { CombatantProperties } from "../combatants/combatant-properties.js";
import { Combatant } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EntityId } from "../primatives/index.js";

export interface CharacterInSlot {
  combatant: Combatant;
  pets: Combatant[];
}

type SlotIndex = number;
type SavedCharacterSlots = Record<SlotIndex, CharacterInSlot>;

export type CharacterSlot = {
  id: string;
  profileId: number;
  slotNumber: number;
  characterId: null | EntityId;
  createdAt: number | Date;
  updatedAt: number | Date;
};

export type SerializedPlayerCharacter = {
  id: EntityId;
  name: string;
  ownerId: number;
  gameVersion: string;
  combatantProperties: CombatantProperties;
  createdAt: number | Date;
  updatedAt: number | Date;
  pets: Combatant[];
};

export interface SavedCharacterFetchStrategy {
  fetchSlots: (profileId: number) => Promise<CharacterSlot[]>;
  fetchCharacter: (characterId: EntityId) => Promise<SerializedPlayerCharacter>;
}

export class SavedCharactersService {
  constructor(private savedCharacterFetchStrategy: SavedCharacterFetchStrategy) {}

  async fetchSavedCharacters(profileId: number): Promise<SavedCharacterSlots> {
    const slots = await this.savedCharacterFetchStrategy.fetchSlots(profileId);
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
    const character = await this.savedCharacterFetchStrategy.fetchCharacter(characterId);

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
