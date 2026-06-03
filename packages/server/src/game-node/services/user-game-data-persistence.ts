import {
  CharacterControlScheme,
  Combatant,
  EntityId,
  ERROR_MESSAGES,
  GameId,
  IdentityProviderId,
  invariant,
  IronmanRunPersistenceStrategy,
  SavedCharacterPersistenceStrategy,
  SavedIronmanRun,
  SerializedOf,
  SerializedPlayerCharacter,
} from "@speed-dungeon/common";
import { PlayerCharacterRepo } from "../../database/repos/player-characters.js";
import { SavedIronmanRunRepo } from "../../database/repos/saved-ironman-runs.js";

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

export class DatabaseIronmanRunPersistenceStrategy implements IronmanRunPersistenceStrategy {
  constructor(private savedIronmanRunsRepo: SavedIronmanRunRepo) {}

  async save(run: SerializedOf<SavedIronmanRun>): Promise<void> {
    const expected = await this.savedIronmanRunsRepo.upsert(run);
    if (expected === undefined) {
      throw new Error(ERROR_MESSAGES.DATABASE.SAVING);
    }
  }

  async fetchRunOption(runId: GameId): Promise<SerializedOf<SavedIronmanRun> | undefined> {
    return this.savedIronmanRunsRepo.fetchRunOption(runId);
  }

  async delete(runId: GameId): Promise<void> {
    await this.savedIronmanRunsRepo.deleteById(runId);
  }
}
