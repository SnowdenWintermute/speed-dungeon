import {
  CharacterSlot,
  Combatant,
  EntityId,
  ERROR_MESSAGES,
  invariant,
  ProfileId,
  SavedCharacterPersistenceStrategy,
  SavedCharacterSlotsPersistenceStrategy,
  SerializedPlayerCharacter,
} from "@speed-dungeon/common";
import { CharacterSlotsRepo } from "../../database/repos/character-slots.js";
import { PlayerCharacterRepo } from "../../database/repos/player-characters.js";

export class DatabaseSavedCharacterSlotsPersistenceStrategy
  implements SavedCharacterSlotsPersistenceStrategy
{
  constructor(private characterSlotsRepo: CharacterSlotsRepo) {}

  async createSlots(profileId: ProfileId): Promise<void> {
    //
  }

  async fetchSlots(profileId: number): Promise<CharacterSlot[]> {
    const expectedSlots = await this.characterSlotsRepo.find("profileId", profileId);
    if (expectedSlots === undefined) {
      throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_NOT_FOUND);
    }
    return expectedSlots;
  }

  async update(characterSlot: CharacterSlot): Promise<CharacterSlot> {
    const expectedSlot = await this.characterSlotsRepo.update(characterSlot);
    if (expectedSlot === undefined) {
      throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_NOT_FOUND);
    }

    return expectedSlot;
  }
}

export class DatabaseSavedCharacterPersistenceStrategy
  implements SavedCharacterPersistenceStrategy
{
  constructor(private playerCharactersRepo: PlayerCharacterRepo) {}

  async fetchCharacter(characterId: EntityId): Promise<SerializedPlayerCharacter> {
    const expected = await this.playerCharactersRepo.findOne("id", characterId);
    if (expected === undefined) {
      throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_NOT_FOUND);
    }
    return expected;
  }

  async insert(
    combatant: Combatant,
    pets: Combatant[],
    ownerId: number
  ): Promise<SerializedPlayerCharacter> {
    const expected = await this.playerCharactersRepo.insert(combatant, pets, ownerId);
    if (expected === undefined) {
      throw new Error(ERROR_MESSAGES.DATABASE.SAVING);
    }
    return expected;
  }

  async update(combatant: Combatant, pets: Combatant[]): Promise<SerializedPlayerCharacter> {
    const expected = await this.playerCharactersRepo.findOne("id", combatant.getEntityId());
    invariant(expected !== undefined, ERROR_MESSAGES.DATABASE.SAVING);
    expected.combatantProperties = combatant.combatantProperties.toSerialized();
    const saved = await this.playerCharactersRepo.update(expected, pets);
    invariant(saved !== undefined, ERROR_MESSAGES.DATABASE.SAVING);
    return saved;
  }

  async delete(id: number | string): Promise<SerializedPlayerCharacter> {
    const expected = await this.playerCharactersRepo.delete(id);
    if (expected === undefined) {
      throw new Error(ERROR_MESSAGES.DATABASE.SAVING);
    }
    return expected;
  }
}
