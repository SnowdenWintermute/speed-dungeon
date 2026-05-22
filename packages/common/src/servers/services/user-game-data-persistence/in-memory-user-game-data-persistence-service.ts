import { CharacterSlotIndex, EntityId, IdentityProviderId, ProfileId } from "../../../aliases.js";
import { DEFAULT_ACCOUNT_CHARACTER_CAPACITY } from "../../../app-consts.js";
import { Combatant } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { CharacterControlScheme, GameMode } from "../../../game-modes/index.js";
import { iterateNumericEnum, SequentialIdGenerator } from "../../../utils/index.js";
import { CharacterSlotsPersistenceStrategy } from "./character-slots-persistence-strategy.js";
import { CharacterSlot } from "./character-slots.js";
import { SavedCharacterPersistenceStrategy } from "./saved-character-persistence-strategy.js";
import { SerializedPlayerCharacter } from "./serialized-player-character.js";

export class InMemorySavedCharacterSlotsPersistenceStrategy
  implements CharacterSlotsPersistenceStrategy
{
  private readonly slotsByProfileId = new Map<
    ProfileId,
    Map<CharacterControlScheme, CharacterSlot[]>
  >();
  private idGenerator = new SequentialIdGenerator();

  async fetchSlots(
    profileId: ProfileId,
    controlScheme: CharacterControlScheme
  ): Promise<CharacterSlot[]> {
    const expectedSlots = this.slotsByProfileId.get(profileId)?.get(controlScheme);
    if (expectedSlots === undefined) {
      throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOTS_NOT_INITIALIZED);
    }
    return expectedSlots;
  }

  async update(characterSlot: CharacterSlot): Promise<CharacterSlot> {
    for (const [profileId, slotsByControlScheme] of this.slotsByProfileId) {
      for (const [controlScheme, slots] of slotsByControlScheme) {
        for (const slot of slots) {
          if (slot.id === characterSlot.id) {
            return Object.assign(slot, characterSlot);
          }
        }
      }
    }

    throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_NOT_FOUND);
  }

  async createSlots(profileId: ProfileId) {
    if (this.slotsByProfileId.has(profileId)) {
      throw new Error("slots already exist for profile");
    }

    this.slotsByProfileId.set(profileId, new Map<CharacterControlScheme, []>());
    for (const controlScheme of iterateNumericEnum(CharacterControlScheme)) {
      const slots: CharacterSlot[] = [];
      for (let i = 0; i < DEFAULT_ACCOUNT_CHARACTER_CAPACITY; i += 1) {
        slots[i] = new CharacterSlot(
          this.idGenerator.getNextId(),
          profileId,
          i as CharacterSlotIndex
        );
      }
      this.slotsByProfileId.get(profileId)?.set(controlScheme, slots);
    }
  }
}

export class InMemorySavedCharacterPersistenceStrategy
  implements SavedCharacterPersistenceStrategy
{
  private readonly savedCharacters = new Map<EntityId, SerializedPlayerCharacter>();

  async fetchCharacter(characterId: EntityId): Promise<SerializedPlayerCharacter> {
    const expected = this.savedCharacters.get(characterId);
    if (expected === undefined) {
      throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_NOT_FOUND);
    }
    return expected;
  }

  async insert(
    combatant: Combatant,
    pets: Combatant[],
    ownerId: IdentityProviderId
  ): Promise<SerializedPlayerCharacter> {
    const serialized = new SerializedPlayerCharacter(combatant, pets, ownerId);
    this.savedCharacters.set(serialized.id, serialized);
    return serialized;
  }

  async update(combatant: Combatant, pets: Combatant[]): Promise<SerializedPlayerCharacter> {
    const expected = await this.fetchCharacter(combatant.getEntityId());
    expected.combatantProperties = combatant.combatantProperties.toSerialized();
    expected.pets = pets.map((pet) => pet.toSerialized());
    return expected;
  }

  async delete(id: number | string): Promise<SerializedPlayerCharacter> {
    const expected = await this.fetchCharacter(id as EntityId);
    if (expected === undefined) {
      throw new Error(ERROR_MESSAGES.DATABASE.SAVING);
    }
    const _wasDeleted = this.savedCharacters.delete(id as EntityId);
    return expected;
  }
}
