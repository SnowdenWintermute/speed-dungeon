import { EntityName } from "../../../aliases.js";
import { MAX_CHARACTER_NAME_LENGTH } from "../../../app-consts.js";
import { CombatantClass } from "../../../combatants/combatant-class/classes.js";
import { Combatant } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { GameMode } from "../../../types.js";
import { CharacterCreator } from "../../../character-creation/index.js";
import { SavedCharactersService } from "../../services/saved-characters.js";
import { SessionAuthorizationManager } from "../../sessions/authorization-manager.js";
import { UserSession } from "../../sessions/user-session.js";
import { GameStateUpdateDispatchFactory } from "../../update-delivery/game-state-update-dispatch-factory.js";
import { GameStateUpdateDispatchOutbox } from "../../update-delivery/outbox.js";
import { LobbyState } from "../lobby-state.js";

export class CharacterLifecycleController {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly updateDispatchFactory: GameStateUpdateDispatchFactory,
    private readonly savedCharactersService: SavedCharactersService,
    private readonly characterCreator: CharacterCreator
  ) {}

  static requireValidCharacterNameLength(name: string) {
    if (name.length > MAX_CHARACTER_NAME_LENGTH) {
      throw new Error(ERROR_MESSAGES.COMBATANT.MAX_NAME_LENGTH_EXCEEDED);
    }
  }

  createCharacterHandler(
    session: UserSession,
    data: { name: EntityName; combatantClass: CombatantClass }
  ) {
    const game = session.getExpectedCurrentGame();
    const party = session.getExpectedCurrentParty(game);
    const { name, combatantClass } = data;

    CharacterLifecycleController.requireValidCharacterNameLength(name);

    const newCharacter = this.characterCreator.createCharacter(
      name,
      combatantClass,
      session.username
    );

    const pets: Combatant[] = [];

    const player = game.getExpectedPlayer(session.username);
    game.addCharacterToParty(party, player, newCharacter, pets);

    const serialized = newCharacter.getSerialized();
    const serializedPets = pets.map((pet) => pet.getSerialized());

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.CharacterAddedToParty,
      data: { username: session.username, character: serialized, pets: serializedPets },
    });

    return outbox;
  }

  deleteCharacterHandler(session: UserSession, data: { characterId: string }) {
    const { characterId } = data;
    const game = session.getExpectedCurrentGame();
    const player = game.getExpectedPlayer(session.username);

    const playerDoesNotOwnCharacter = !player.characterIds.includes(characterId.toString());
    if (playerDoesNotOwnCharacter) {
      throw new Error(ERROR_MESSAGES.PLAYER.CHARACTER_NOT_OWNED);
    }

    const party = session.getExpectedCurrentParty(game);
    party.removeCharacter(characterId, player, game);

    party.combatantManager.updateHomePositions();

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);

    const wasReadied = game.playersReadied.includes(session.username);
    if (wasReadied) {
      game.togglePlayerReadyToStartGameStatus(session.username);
      outbox.pushToChannel(game.getChannelName(), {
        type: GameStateUpdateType.PlayerToggledReadyToStartGame,
        data: { username: session.username },
      });
    }

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.CharacterDeleted,
      data: { username: session.username, characterId },
    });

    return outbox;
  }

  async selectProgressionGameCharacterHandler(session: UserSession, data: { entityId: string }) {
    const game = session.getExpectedCurrentGame();

    game.requireMode(GameMode.Progression);

    const loggedInUser = await this.sessionAuthManager.requireAuthorizedSession(session);

    const characters = await this.savedCharactersService.fetchSavedCharacters(
      loggedInUser.profile.id
    );

    const userHasNoSavedCharacters = Object.values(characters).length === 0;
    if (userHasNoSavedCharacters) {
      throw new Error(ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);
    }

    const { entityId } = data;
    const savedCharacter = SavedCharactersService.getLivingCharacterInSlotsById(
      entityId,
      characters
    );

    const player = game.getExpectedPlayer(session.username);
    const characterIdToRemoveOption = player.characterIds[0];
    if (characterIdToRemoveOption === undefined) {
      throw new Error("Expected to have a selected character but didn't");
    }

    const party = session.getExpectedCurrentParty(game);
    const removedChacter = party.removeCharacter(characterIdToRemoveOption, player, game);

    delete game.lowestStartingFloorOptionsBySavedCharacter[removedChacter.getEntityId()];

    game.addCharacterToParty(party, player, savedCharacter.combatant, savedCharacter.pets);

    game.setMaxStartingFloor();

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame,
      data: {
        username: session.username,
        character: {
          combatant: savedCharacter.combatant.getSerialized(),
          pets: savedCharacter.pets.map((pet) => pet.getSerialized()),
        },
      },
    });

    return outbox;
  }

  private createTestPets() {
    // // const testPet = generateMonster(1, 1, MonsterType.Wolf);
    // // delete testPet.combatantProperties.threatManager;
    // // testPet.combatantProperties.controlledBy.controllerType = CombatantControllerType.PlayerPetAI;
    // // testPet.combatantProperties.classProgressionProperties.experiencePoints.changeExperience(81);
    // // testPet.combatantProperties.attributeProperties.changeUnspentPoints(10);
    // // const pets: Combatant[] = [testPet];
  }
}
