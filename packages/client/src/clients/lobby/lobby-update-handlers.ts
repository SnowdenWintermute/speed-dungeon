import { setAlert } from "@/app/components/alerts";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import { GameWorldView } from "@/game-world-view";
import { ImageManagerRequestType } from "@/game-world-view/image-manager";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { useHttpRequestStore } from "@/stores/http-request-store";
import {
  enqueueCharacterItemsForThumbnails,
  enqueueConsumableGenericThumbnailCreation,
} from "@/utils/enqueue-character-items-for-thumbnails";
import { Vector3 } from "@babylonjs/core";
import {
  ActionCommandType,
  AdventuringParty,
  Combatant,
  ERROR_MESSAGES,
  GameMode,
  GameStateUpdateMap,
  GameStateUpdateType,
  getProgressionGamePartyName,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";

export type LobbyUpdateHandler<K extends keyof GameStateUpdateMap> = (
  data: GameStateUpdateMap[K]
) => void;

export type LobbyUpdateHandlers = {
  [K in keyof GameStateUpdateMap]: LobbyUpdateHandler<K>;
};

export function createLobbyUpdateHandlers(
  appStore: AppStore,
  gameWorldViewOption: GameWorldView | undefined
): Partial<LobbyUpdateHandlers> {
  const { lobbyStore, gameStore, actionMenuStore, gameEventNotificationStore } = appStore;
  return {
    [GameStateUpdateType.OnConnection]: (data) => {
      console.log("got on connection");
      gameStore.setUsername(data.username);
    },
    [GameStateUpdateType.ChannelFullUpdate]: (data) => {
      lobbyStore.updateChannel(data.channelName, data.users);
    },
    [GameStateUpdateType.UserJoinedChannel]: (data) =>
      lobbyStore.handleUserJoinedChannel(data.username, data.userChannelDisplayData),
    [GameStateUpdateType.UserLeftChannel]: (data) =>
      lobbyStore.handleUserLeftChannel(data.username),
    [GameStateUpdateType.GameList]: (data) => lobbyStore.setGameList(data.gameList),
    [GameStateUpdateType.GameFullUpdate]: (data) => {
      let { game } = data;
      if (game) {
        game = SpeedDungeonGame.getDeserialized(game);
      } else {
        gameWorldViewOption?.modelManager.modelActionQueue.enqueueMessage({
          type: ModelActionType.ClearAllModels,
        });
      }

      gameWorldViewOption?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantModels,
        placeInHomePositions: true,
      });
      gameWorldViewOption?.imageManager.enqueueMessage({
        type: ImageManagerRequestType.ClearState,
      });

      const currentSessionHttpResponseTracker =
        useHttpRequestStore.getState().requests[HTTP_REQUEST_NAMES.GET_SESSION];
      const isLoggedIn = currentSessionHttpResponseTracker?.statusCode === 200;

      if (game === null) {
        gameStore.clearGame();
        if (isLoggedIn) {
          gameWorldViewOption?.drawCharacterSlots();
        }
      } else {
        gameStore.setGame(game);
      }

      actionMenuStore.clearStack();
    },
    [GameStateUpdateType.PlayerJoinedGame]: (data) => {
      const gameOption = gameStore.getGameOption();
      const player = new SpeedDungeonPlayer(data.username);
      if (gameOption) {
        gameOption.addPlayer(player);
      }
    },
    [GameStateUpdateType.PlayerLeftGame]: (data) => {
      const { username } = data;
      gameWorldViewOption?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.ProcessActionCommands,
        actionCommandPayloads: [{ type: ActionCommandType.RemovePlayerFromGame, username }],
      });

      const gameOption = AppStore.get().gameStore.getGameOption();
      if (!gameOption) {
        return;
      }

      const maxStartingFloor = gameOption.getMaxStartingFloor();

      if (gameOption.selectedStartingFloor > maxStartingFloor) {
        gameOption.selectedStartingFloor = maxStartingFloor;
      }
    },
    [GameStateUpdateType.PartyCreated]: (data) => {
      const gameOption = gameStore.getGameOption();
      if (!gameOption) {
        return;
      }
      const { partyId, partyName } = data;
      gameOption.addParty(AdventuringParty.createInitialized(partyId, partyName));
    },
    [GameStateUpdateType.PlayerChangedAdventuringParty]: (data) => {
      const gameOption = gameStore.getGameOption();
      if (!gameOption) {
        return;
      }
      // ignore if game already started. this is a relic of the fact we remove them
      // from their party when leaving a lobby game, but it is an unhandled crash
      // to remove them from a party when still in a game
      const { playerName, partyName } = data;
      if (gameOption.getTimeStarted() === null) {
        gameOption.removePlayerFromParty(playerName);
        if (partyName === null) {
          return;
        }
        gameOption.putPlayerInParty(partyName, playerName);
      }
    },
    [GameStateUpdateType.CharacterAddedToParty]: (data) => {
      const { username, character, pets } = data;
      const { game, party, player } = gameStore.getExpectedPlayerContext(username);

      try {
        const deserialized = Combatant.getDeserialized(character);

        const deserializedPets: Combatant[] = [];
        for (const pet of pets) {
          const deserializedPet = Combatant.getDeserialized(pet);
          deserializedPets.push(deserializedPet);
        }

        game.addCharacterToParty(party, player, deserialized, deserializedPets);
      } catch (error) {
        if (error instanceof Error) {
          setAlert(error.message);
          console.trace(error);
        } else console.error(error);
      }

      if (game.mode === GameMode.Progression) {
        gameWorldViewOption?.modelManager.modelActionQueue.enqueueMessage({
          type: ModelActionType.SynchronizeCombatantModels,
          placeInHomePositions: true,
        });
      }
    },
    [GameStateUpdateType.CharacterDeleted]: (data) => {
      const { username, characterId } = data;
      const { game, party, player } = gameStore.getExpectedPlayerContext(username);
      party.removeCharacter(characterId, player, game);
      party.combatantManager.updateHomePositions();
    },
    [GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame]: (data) => {
      const game = gameStore.getExpectedGame();

      const { username, character } = data;
      const deserialized = {
        combatant: Combatant.getDeserialized(character.combatant),
        pets: character.pets.map((pet) => Combatant.getDeserialized(pet)),
      };

      game.lowestStartingFloorOptionsBySavedCharacter[character.combatant.entityProperties.id] =
        character.combatant.combatantProperties.deepestFloorReached;

      const partyName = getProgressionGamePartyName(game.name);
      const party = game.adventuringParties[partyName];
      if (!party) {
        return setAlert(new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST));
      }
      const player = game.getPlayer(username);
      if (!player) {
        return setAlert(new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));
      }

      const previouslySelectedCharacterId = player.characterIds[0];
      if (previouslySelectedCharacterId) {
        try {
          const removedCharacterResult = party.removeCharacter(
            previouslySelectedCharacterId,
            player,
            game
          );
          delete game.lowestStartingFloorOptionsBySavedCharacter[
            removedCharacterResult.entityProperties.id
          ];
          party.combatantManager.updateHomePositions();
        } catch (err) {
          return setAlert(err as Error);
        }
      }

      game.addCharacterToParty(party, player, deserialized.combatant, deserialized.pets);

      gameWorldViewOption?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantModels,
        placeInHomePositions: true,
      });
    },
    [GameStateUpdateType.PlayerToggledReadyToStartGame]: (data) => {
      const game = gameStore.getExpectedGame();
      game.togglePlayerReadyToStartGameStatus(data.username);
    },
    [GameStateUpdateType.ProgressionGameStartingFloorSelected]: (data) => {
      const gameOption = gameStore.getGameOption();
      if (gameOption) {
        gameOption.selectedStartingFloor = data.floorNumber;
      }
    },
    [GameStateUpdateType.GameStarted]: (_) => {
      gameEventNotificationStore.clearGameLog();
      GameLogMessageService.postGameStarted();

      AppStore.get().actionMenuStore.initialize(new BaseMenuState());

      characterAutoFocusManager.focusFirstOwnedCharacter();

      const { game, party } = gameStore.getFocusedCharacterContext();

      game.setAsStarted();

      const camera = gameWorldViewOption?.camera;
      if (!camera) {
        console.error("no camera found");
        return;
      }
      camera.target.copyFrom(new Vector3(-1, 0.85, 0.51));
      camera.alpha = 4.7;
      camera.beta = 1.06;
      camera.radius = 10.94;

      party.dungeonExplorationManager.setCurrentFloor(game.selectedStartingFloor);

      gameWorldViewOption?.clearFloorTexture();

      enqueueConsumableGenericThumbnailCreation();

      const { combatantManager } = party;

      for (const character of combatantManager.getAllCombatants()) {
        enqueueCharacterItemsForThumbnails(character);
      }

      combatantManager.updateHomePositions();
      combatantManager.setAllCombatantsToHomePositions();

      gameWorldViewOption?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantModels,
        placeInHomePositions: true,
      });
    },
  };
}
