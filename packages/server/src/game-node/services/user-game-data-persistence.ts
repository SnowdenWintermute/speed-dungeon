import {
  CharacterControlScheme,
  Combatant,
  EntityId,
  ERROR_MESSAGES,
  IdentityProviderId,
  invariant,
  SavedCharacterPersistenceStrategy,
  SerializedPlayerCharacter,
} from "@speed-dungeon/common";
import { PlayerCharacterRepo } from "../../database/repos/player-characters.js";

export class DatabaseSavedCharacterPersistenceStrategy
  implements SavedCharacterPersistenceStrategy
{
  constructor(private playerCharactersRepo: PlayerCharacterRepo) {}

  async fetchCharacter(characterId: EntityId): Promise<SerializedPlayerCharacter> {
    const expected = await this.playerCharactersRepo.findOne("id", characterId);
    if (expected === undefined) {
      throw new Error(ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_FOUND);
    }
    return expected;
  }

  async findByOwnerAndControlScheme(
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ): Promise<SerializedPlayerCharacter[]> {
    return this.playerCharactersRepo.findByOwnerAndControlScheme(ownerId, controlScheme);
  }

  async insert(
    combatant: Combatant,
    pets: Combatant[],
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ): Promise<SerializedPlayerCharacter> {
    const expected = await this.playerCharactersRepo.insert(
      combatant,
      pets,
      ownerId,
      controlScheme
    );
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
