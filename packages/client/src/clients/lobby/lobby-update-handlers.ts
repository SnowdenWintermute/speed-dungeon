import { setAlert } from "@/app/components/alerts";
import { GameWorldView } from "@/game-world-view";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";
import { CharacterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { gameClientSingleton } from "@/singletons/lobby-client";
import {
  ActionCommandType,
  AdventuringParty,
  BrowserWebSocketConnectionEndpoint,
  Combatant,
  ConnectionEndpoint,
  ConnectionId,
  deserializeMap,
  ERROR_MESSAGES,
  GameMode,
  GameStateUpdateMap,
  GameStateUpdateType,
  getProgressionGamePartyName,
  QUERY_PARAMS,
  SpeedDungeonPlayer,
  urlWithQueryParams,
} from "@speed-dungeon/common";
import { GameClient } from "../game";
import { gameFullUpdateHandler } from "../common-handlers/game-full-update";

export type LobbyUpdateHandler<K extends keyof GameStateUpdateMap> = (
  data: GameStateUpdateMap[K]
) => void;

export type LobbyUpdateHandlers = {
  [K in keyof GameStateUpdateMap]: LobbyUpdateHandler<K>;
};

export function createLobbyUpdateHandlers(
  appStore: AppStore,
  gameWorldView: {
    current: null | GameWorldView;
  },
  characterAutoFocusManager: CharacterAutoFocusManager,
  connectionEndpoint: ConnectionEndpoint
): Partial<LobbyUpdateHandlers> {
  const { lobbyStore, gameStore, actionMenuStore } = appStore;
  return {
    [GameStateUpdateType.ErrorMessage]: (data) => {
      setAlert(data.message);
    },
    [GameStateUpdateType.OnConnection]: (data) => {
      gameStore.setUsername(data.username);
    },
    [GameStateUpdateType.ChannelFullUpdate]: (data) => {
      const deserialized = deserializeMap(data.users);
      lobbyStore.updateChannel(data.channelName, deserialized);
    },
    [GameStateUpdateType.UserJoinedChannel]: (data) =>
      lobbyStore.handleUserJoinedChannel(data.username, data.userChannelDisplayData),
    [GameStateUpdateType.UserLeftChannel]: (data) =>
      lobbyStore.handleUserLeftChannel(data.username),
    [GameStateUpdateType.GameList]: (data) => lobbyStore.setGameList(data.gameList),
    [GameStateUpdateType.GameFullUpdate]: (data) => {
      gameFullUpdateHandler(data.game, gameStore, actionMenuStore, gameWorldView);
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
      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
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
        gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
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

      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
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
    [GameStateUpdateType.SavedCharacterList]: (data) => {
      const { characterSlots } = data;
      {
        const deserialized: Record<number, null | { combatant: Combatant; pets: Combatant[] }> = {};
        for (const [slotNumberStringKey, characterOption] of Object.entries(characterSlots)) {
          const slotNumber = parseInt(slotNumberStringKey);
          if (characterOption === null) {
            deserialized[slotNumber] = null;
          } else {
            deserialized[slotNumber] = {
              combatant: Combatant.getDeserialized(characterOption.combatant),
              pets: characterOption.pets.map((pet) => Combatant.getDeserialized(pet)),
            };
          }
        }

        lobbyStore.setSavedCharacterSlots(deserialized);

        gameWorldView.current?.drawCharacterSlots();

        gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
          type: ModelActionType.SynchronizeCombatantModels,
          placeInHomePositions: true,
        });
      }
    },
    [GameStateUpdateType.SavedCharacterDeleted]: (data) => {
      lobbyStore.deleteSavedCharacter(data.entityId);
      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantModels,
        placeInHomePositions: true,
      });
    },
    [GameStateUpdateType.SavedCharacter]: (data) => {
      const { character, slotIndex } = data;
      const { combatant, pets } = character;
      const deserializedCombatant = Combatant.getDeserialized(combatant);
      const deserializedPets = pets.map((pet) => Combatant.getDeserialized(pet));

      lobbyStore.setSavedCharacterSlot(
        { combatant: deserializedCombatant, pets: deserializedPets },
        slotIndex
      );

      gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantModels,
        placeInHomePositions: true,
      });
    },
    [GameStateUpdateType.GameServerConnectionInstructions]: (data) => {
      const { connectionInstructions } = data;
      const { url, encryptedSessionClaimToken } = connectionInstructions;

      connectionEndpoint.close();

      const queryParams = {
        name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
        value: encryptedSessionClaimToken,
      };

      // online
      const ws = new WebSocket(urlWithQueryParams(url, [queryParams]));
      const gameServerConnectionEndpoint = new BrowserWebSocketConnectionEndpoint(
        ws,
        "" as ConnectionId
      );
      gameClientSingleton.setClient(
        new GameClient(
          "Game server",
          gameServerConnectionEndpoint,
          appStore,
          gameWorldView,
          characterAutoFocusManager
        )
      );
    },
  };
}
