import { Combatant } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import {
  CharacterSlotIndex,
  EntityId,
  GameId,
  IdentityProviderId,
  ProfileId,
} from "../../../aliases.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../game/player.js";
import {
  getProgressionGamePartyName,
  invariant,
  iterateNumericEnum,
} from "../../../utils/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CharacterInSlot, CharacterSlot, SavedCharacterSlots } from "./character-slots.js";
import { CharacterControlScheme, GameMode } from "../../../game-modes/index.js";
import { IronmanRunPersistenceStrategy, SavedIronmanRun } from "./saved-ironman-runs.js";
import { SavedCharacterPersistenceStrategy } from "./saved-character-persistence-strategy.js";
import { CharacterSlotsPersistenceStrategy } from "./character-slots-persistence-strategy.js";
import { UserSession } from "../../sessions/user-session.js";
import { SerializedOf } from "../../../serialization/index.js";
import { SpeedDungeonProfileService } from "../profiles.js";
import { UserIdType } from "../../sessions/user-ids.js";

export class UserGameDataPersistenceService {
  constructor(
    private readonly characterSlotsPersistenceStrategy: CharacterSlotsPersistenceStrategy,
    private readonly savedCharacterPersistenceStrategy: SavedCharacterPersistenceStrategy,
    private readonly savedIronmanRunPersistenceStrategy: IronmanRunPersistenceStrategy,
    private readonly profileService: SpeedDungeonProfileService
  ) {}

  async saveIronmanRun(game: SpeedDungeonGame, userSessions: UserSession[]): Promise<void> {
    game.requireMode(GameMode.Ironman);
    const run = new SavedIronmanRun(game, game.getAuthUserIdsToUsernames(userSessions));
    const serializedRun = run.toSerialized();
    this.savedIronmanRunPersistenceStrategy.save(serializedRun);
    await this.addRunIdReferencesToUserProfiles(game.id, userSessions);
  }

  private async addRunIdReferencesToUserProfiles(runId: GameId, userSessions: UserSession[]) {
    for (const session of userSessions) {
      invariant(session.taggedUserId.type === UserIdType.Auth, ERROR_MESSAGES.AUTH.REQUIRED);
      const profile = await this.profileService.fetchExpectedProfile(session.taggedUserId.id);
      if (!profile.ironmanRunIds.includes(runId)) {
        profile.ironmanRunIds.push(runId);
        await this.profileService.update(session.taggedUserId.id, profile);
      }
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

  async fetchSavedCharacterSlots(
    profileId: ProfileId,
    controlScheme: CharacterControlScheme
  ): Promise<SavedCharacterSlots> {
    const slots = await this.characterSlotsPersistenceStrategy.fetchSlots(profileId, controlScheme);

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

    return {
      combatant: {
        entityProperties: { id: character.id, name: character.name },
        combatantProperties: character.combatantProperties,
      },
      pets: character.pets,
    };
  }

  async requireEmptyCharacterSlot(
    profileId: ProfileId,
    slotIndex: CharacterSlotIndex,
    controlScheme: CharacterControlScheme
  ) {
    const slots = await this.characterSlotsPersistenceStrategy.fetchSlots(profileId, controlScheme);
    const slotOption = slots.find((slot) => slot.slotNumber === slotIndex);

    if (slotOption === undefined) {
      throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_NOT_FOUND);
    }

    const slotIsFilled = slotOption.characterId !== null;
    if (slotIsFilled) {
      throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_FULL);
    }

    return slotOption;
  }

  async requireSlotWithCharacterId(profileId: ProfileId, characterId: EntityId) {
    for (const controlScheme of iterateNumericEnum(CharacterControlScheme)) {
      const slots = await this.characterSlotsPersistenceStrategy.fetchSlots(
        profileId,
        controlScheme
      );
      for (const slot of slots) {
        if (slot.characterId === characterId) {
          return slot;
        }
      }
    }

    throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_NOT_FOUND);
  }

  async saveCharacterInSlot(
    slot: CharacterSlot,
    newCharacter: Combatant,
    pets: Combatant[],
    userId: IdentityProviderId
  ) {
    await this.savedCharacterPersistenceStrategy.insert(newCharacter, pets, userId);
    slot.characterId = newCharacter.entityProperties.id;
    await this.characterSlotsPersistenceStrategy.update(slot);
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

  async deleteCharacterInSlot(characterId: EntityId, slot: CharacterSlot) {
    await this.savedCharacterPersistenceStrategy.delete(characterId);
    slot.characterId = null;
    await this.characterSlotsPersistenceStrategy.update(slot);
  }

  static getLivingCharacterInSlotsById(entityId: EntityId, slots: SavedCharacterSlots) {
    let savedCharacterOption: undefined | CharacterInSlot;
    for (const character of Object.values(slots)) {
      if (character.combatant.entityProperties.id === entityId) {
        // @PERF - we deserialize entire combatant just to check if dead -> seems expensive?
        if (Combatant.fromSerialized(character.combatant).combatantProperties.isDead()) {
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
