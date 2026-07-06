import { Combatant } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { EntityId, GameId, IdentityProviderId, Username } from "../../../aliases.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../game/player.js";
import { getProgressionGamePartyName } from "../../../utils/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { SerializedCombatantWithPets } from "./serialized-combatant-with-pets.js";
import { CharacterControlScheme, GameMode } from "../../../game-modes/index.js";
import { IronmanRunPersistenceStrategy, SavedIronmanRun } from "./saved-ironman-runs.js";
import { SavedCharacterPersistenceStrategy } from "./saved-character-persistence-strategy.js";
import { SerializedOf } from "../../../serialization/index.js";
import { SpeedDungeonProfile, SpeedDungeonProfileService } from "../profiles.js";

export class UserGameDataPersistenceService {
  constructor(
    private readonly savedCharacterPersistenceStrategy: SavedCharacterPersistenceStrategy,
    private readonly savedIronmanRunPersistenceStrategy: IronmanRunPersistenceStrategy,
    private readonly profileService: SpeedDungeonProfileService
  ) {}

  async saveIronmanRun(
    game: SpeedDungeonGame,
    userIdsToUsernamesMap: Map<IdentityProviderId, Username>
  ): Promise<void> {
    game.requireMode(GameMode.Ironman);
    const run = new SavedIronmanRun(game, userIdsToUsernamesMap);
    const serializedRun = run.toSerialized();
    await this.savedIronmanRunPersistenceStrategy.save(serializedRun);
    await this.addRunIdReferencesToUserProfiles(game.id, [...userIdsToUsernamesMap.keys()]);
  }

  private async addRunIdReferencesToUserProfiles(runId: GameId, userIds: IdentityProviderId[]) {
    for (const userId of userIds) {
      const profile = await this.profileService.fetchExpectedProfile(userId);
      if (profile.ironmanRunIds.includes(runId)) continue;

      const candidate: SpeedDungeonProfile = {
        ...profile,
        ironmanRunIds: [...profile.ironmanRunIds, runId],
      };
      await this.profileService.update(userId, candidate);
      profile.ironmanRunIds.push(runId);
    }
  }

  async requireIronmanRun(gameId: GameId): Promise<SerializedOf<SavedIronmanRun>> {
    const existingRunOption = await this.savedIronmanRunPersistenceStrategy.fetchRunOption(gameId);
    if (existingRunOption) {
      return existingRunOption;
    }
    throw new Error(ERROR_MESSAGES.GAME.NOT_FOUND);
  }

  async deleteIronmanRun(gameId: GameId): Promise<void> {
    await this.savedIronmanRunPersistenceStrategy.delete(gameId);
  }

  async fetchSavedCharacters(
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ): Promise<SerializedCombatantWithPets[]> {
    const records = await this.savedCharacterPersistenceStrategy.findByOwnerAndControlScheme(
      ownerId,
      controlScheme
    );

    return records.map((record) => ({
      combatant: {
        entityProperties: { id: record.id, name: record.name },
        combatantProperties: record.combatantProperties,
      },
      pets: record.pets,
    }));
  }

  async fetchSavedCharacter(characterId: EntityId): Promise<SerializedCombatantWithPets> {
    const character = await this.savedCharacterPersistenceStrategy.fetchCharacter(characterId);

    return {
      combatant: {
        entityProperties: { id: character.id, name: character.name },
        combatantProperties: character.combatantProperties,
      },
      pets: character.pets,
    };
  }

  async requireCapacityAvailable(
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme,
    capacity: number
  ) {
    const existing = await this.savedCharacterPersistenceStrategy.findByOwnerAndControlScheme(
      ownerId,
      controlScheme
    );
    if (existing.length >= capacity) {
      throw new Error(ERROR_MESSAGES.USER.CHARACTER_CAPACITY_REACHED);
    }
  }

  async requireOwnedCharacter(ownerId: IdentityProviderId, characterId: EntityId) {
    const character = await this.savedCharacterPersistenceStrategy.fetchCharacter(characterId);
    if (character.ownerId !== ownerId) {
      throw new Error(ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_OWNED);
    }
    return character;
  }

  async requireOwnedLivingCharacter(ownerId: IdentityProviderId, characterId: EntityId) {
    const character = await this.requireOwnedCharacter(ownerId, characterId);
    const deserialized = Combatant.fromSerialized({
      entityProperties: { id: character.id, name: character.name },
      combatantProperties: character.combatantProperties,
    });
    if (deserialized.combatantProperties.isDead()) {
      throw new Error(ERROR_MESSAGES.COMBATANT.IS_DEAD);
    }
    return character;
  }

  async saveCharacter(
    combatant: Combatant,
    pets: Combatant[],
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ) {
    await this.savedCharacterPersistenceStrategy.insert(combatant, pets, ownerId, controlScheme);
  }

  async updateCharacter(character: Combatant, pets: Combatant[]) {
    await this.savedCharacterPersistenceStrategy.update(character, pets);
  }

  async updateCharactersOwnedByPlayerInGame(
    game: SpeedDungeonGame,
    player: SpeedDungeonPlayer
  ): Promise<void> {
    if (!player.partyName) {
      throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
    }

    for (const id of player.characterIds) {
      const character = game.getExpectedCombatant(id);
      character.getTargetingProperties().clear({ clearTargetingPreferences: true });

      const party = game.getExpectedParty(getProgressionGamePartyName(game.name));
      const floorNumber = party.dungeonExplorationManager.getCurrentFloor();

      const existingCharacter = await this.savedCharacterPersistenceStrategy.fetchCharacter(
        character.entityProperties.id
      );
      if (floorNumber > existingCharacter.combatantProperties.deepestFloorReached) {
        character.combatantProperties.deepestFloorReached = floorNumber;
      }

      const pets = party.petManager.getAllPetsByOwnerId(existingCharacter.id);
      this.updateCharacter(character, pets);
    }
  }

  async updateAllInParty(game: SpeedDungeonGame, party: AdventuringParty) {
    const promises: Promise<void>[] = [];

    for (const [_, player] of Array.from(game.players)) {
      if (player.partyName === party.name) {
        promises.push(this.updateCharactersOwnedByPlayerInGame(game, player));
      }
    }

    await Promise.all(promises);
  }

  async deleteCharacter(characterId: EntityId) {
    await this.savedCharacterPersistenceStrategy.delete(characterId);
  }
}
