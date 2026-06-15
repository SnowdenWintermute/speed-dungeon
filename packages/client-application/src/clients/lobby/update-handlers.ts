import {
  AdventuringParty,
  CHARACTER_SLOT_SPACING,
  CharacterControlScheme,
  CLIENT_APP_MESSAGES,
  ClientAppMessageType,
  ClientSequentialEventType,
  Combatant,
  ConnectionEndpoint,
  DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
  ERROR_MESSAGES,
  GameMode,
  GameStateUpdateMap,
  GameStateUpdateType,
  getProgressionGamePartyName,
  MapUtils,
  QUERY_PARAMS,
  SavedIronmanRun,
  SavedIronmanRunClientEntry,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import { GAME_SERVER_TRANSITION_TIMEOUT_MS } from "@/client-application/consts";
import { gameFullUpdateHandler } from "../common/game-full-update-handler";
import { DialogElementName } from "@/client-application/ui/dialogs";
import {
  GameLogMessage,
  GameLogMessageStyle,
} from "@/client-application/event-log/game-log-messages";

export type LobbyUpdateHandler<K extends keyof GameStateUpdateMap> = (
  data: GameStateUpdateMap[K]
) => void;

export type LobbyUpdateHandlers = {
  [K in keyof GameStateUpdateMap]: LobbyUpdateHandler<K>;
};

export function createLobbyUpdateHandlers(
  clientApplication: ClientApplication,
  connectionEndpoint: ConnectionEndpoint
): Partial<LobbyUpdateHandlers> {
  const { lobbyContext, gameContext, session, gameWorldView } = clientApplication;
  return {
    [GameStateUpdateType.ErrorMessage]: () => {
      /* handled in BaseClient */
    },
    [GameStateUpdateType.OnConnection]: (data) => {
      if (!data.willBeReconnectedToGame) {
        console.info("token missing, reused or expired");
        clientApplication.topologyManager.waitForReconnectionInstructions.fire();
        clientApplication.reconnectionTokenStore.clearGuestGameReconnectionToken();
      } else {
        clientApplication.eventLogStore.postMessage(
          new GameLogMessage(
            CLIENT_APP_MESSAGES[ClientAppMessageType.ReconnectingToGameServer],
            GameLogMessageStyle.Basic
          )
        );
      }
      clientApplication.topologyManager.clearGameClient();
      session.setUsername(data.username);
    },
    [GameStateUpdateType.ChannelFullUpdate]: (data) => {
      const deserialized = MapUtils.deserialize(data.users, (v) => v);
      lobbyContext.channel.update(deserialized);
      clientApplication.topologyManager.transitionToLobbyServer.fire();
    },
    [GameStateUpdateType.UserJoinedChannel]: (data) =>
      lobbyContext.channel.handleUserJoined(data.username, data.userChannelDisplayData),
    [GameStateUpdateType.UserLeftChannel]: (data) =>
      lobbyContext.channel.handleUserLeft(data.username),
    [GameStateUpdateType.GameList]: (data) => lobbyContext.setGameList(data.gameList),
    [GameStateUpdateType.GameFullUpdate]: (data) => {
      gameFullUpdateHandler(clientApplication, data.game);
      clientApplication.uiStore.dialogs.close(DialogElementName.GameCreation);
    },
    [GameStateUpdateType.PlayerUsernameUpdated]: (data) => {
      const { gameOption } = gameContext;
      if (gameOption) {
        const player = gameOption.getExpectedPlayer(data.oldUsername);
        player.username = data.newUsername;
      }
    },
    [GameStateUpdateType.PlayerJoinedGame]: (data) => {
      const { gameOption } = gameContext;
      const player = new SpeedDungeonPlayer(data.username, data.joinOrder);
      if (gameOption) {
        player.makeObservable();
        gameOption.addPlayer(player);
      }
    },

    [GameStateUpdateType.PlayerLeftGame]: (data) => {
      const { username } = data;
      clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.RemovePlayerFromGame,
        data: { username },
      });

      const { gameOption } = gameContext;
      if (!gameOption) {
        return;
      }

      const { maxStartingFloor } = gameOption;

      if (gameOption.selectedStartingFloor > maxStartingFloor) {
        gameOption.selectedStartingFloor = maxStartingFloor;
      }
    },
    [GameStateUpdateType.PartyCreated]: (data) => {
      const { gameOption } = gameContext;
      if (!gameOption) {
        return;
      }
      const { partyId, partyName } = data;
      const party = AdventuringParty.createInitialized(partyId, partyName);
      party.makeObservable();

      gameOption.addParty(party);
    },
    [GameStateUpdateType.PlayerChangedAdventuringParty]: (data) => {
      const { gameOption } = gameContext;
      if (!gameOption) {
        return;
      }
      // ignore if game already started. this is a relic of the fact we remove them
      // from their party when leaving a lobby game, but it is an unhandled crash
      // to remove them from a party when still in a game
      const { playerName, partyName } = data;
      if (gameOption.timeHandedOff === null) {
        gameOption.removePlayerFromParty(playerName);
        if (partyName === null) {
          return;
        }

        gameOption.putPlayerInParty(partyName, playerName);
      }
    },
    [GameStateUpdateType.CharacterAddedToParty]: (data) => {
      const { username, character, pets } = data;
      const { game, party, player } = gameContext.requirePlayerContext(username);

      const deserialized = Combatant.fromSerialized(character);
      const deserializedPets: Combatant[] = [];
      for (const pet of pets) {
        const deserializedPet = Combatant.fromSerialized(pet);
        deserializedPets.push(deserializedPet);
      }

      game.addCharacterToParty(party, player, deserialized, deserializedPets);

      if (game.mode === GameMode.Progression) {
        clientApplication.sequentialEventProcessor.scheduleEvent({
          type: ClientSequentialEventType.SynchronizeCombatantModels,
          data: { softCleanup: true, placeInHomePositions: true },
        });
      }
    },
    [GameStateUpdateType.CharacterDeleted]: (data) => {
      const { username, characterId } = data;
      const { game, party, player } = gameContext.requirePlayerContext(username);
      party.removeCharacter(characterId, player, game);
      party.combatantManager.updateHomePositions();
    },
    [GameStateUpdateType.PlayerSelectedSavedCharacterInProgressionGame]: (data) => {
      const game = gameContext.requireGame();

      const { username, character } = data;
      const player = game.getPlayer(username);
      if (!player) {
        return clientApplication.alertsService.setAlert(
          new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST)
        );
      }

      const deserialized = {
        combatant: Combatant.fromSerialized(character.combatant),
        pets: character.pets.map((pet) => Combatant.fromSerialized(pet)),
      };

      const partyName = getProgressionGamePartyName(game.name);
      const party = game.adventuringParties.get(partyName);
      if (!party) {
        return clientApplication.alertsService.setAlert(
          new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST)
        );
      }

      game.addCharacterToParty(party, player, deserialized.combatant, deserialized.pets);
      game.selectedStartingFloor = Math.min(game.selectedStartingFloor, game.maxStartingFloor);
      party.dungeonExplorationManager.setCurrentFloor(game.selectedStartingFloor);

      clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantModels,
        data: { softCleanup: true, placeInHomePositions: true },
      });
    },
    [GameStateUpdateType.PlayerToggledReadyToStartGame]: (data) => {
      const game = gameContext.requireGame();
      game.togglePlayerReadyToStartGameStatus(data.username);
    },
    [GameStateUpdateType.DungeonFloorNumber]: (data) => {
      const party = gameContext.requireParty();
      party.dungeonExplorationManager.setCurrentFloor(data.floorNumber);
    },
    [GameStateUpdateType.ProgressionGameStartingFloorSelected]: (data) => {
      const { gameOption } = gameContext;
      if (gameOption) {
        gameOption.selectedStartingFloor = data.floorNumber;
      }
    },
    [GameStateUpdateType.SavedCharacterList]: (data) => {
      const { characterControlScheme, characters, capacity } = data;

      const deserialized = characters.map((entry, i) => {
        const combatant = Combatant.fromSerialized(entry.combatant);
        combatant.combatantProperties.transformProperties.autoSetHomePosition(
          DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
          i,
          {
            onCenterLine: true,
            slotSpacingOverride: CHARACTER_SLOT_SPACING,
            reverseOrder: true,
          }
        );
        return {
          combatant,
          pets: entry.pets.map((pet) => Combatant.fromSerialized(pet)),
        };
      });

      lobbyContext.savedCharacters.setCharacters(characterControlScheme, deserialized);
      lobbyContext.savedCharacters.capacities[characterControlScheme] = capacity;

      gameWorldView?.environment.groundPlane.drawCharacterSlots();

      clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantModels,
        data: { softCleanup: true, placeInHomePositions: true },
      });
    },
    [GameStateUpdateType.IronmanRunsList]: (data) => {
      for (const serialized of data.savedIronmanRuns) {
        const run = SavedIronmanRunClientEntry.fromSerialized(serialized);
        clientApplication.lobbyContext.savedIronmanRuns.set(run.gameId, run);
      }
      clientApplication.lobbyContext.savedIronmanRunCapacity = data.ironmanRunCapacity;
    },
    [GameStateUpdateType.IronmanRunAbandoned]: (data) => {
      const { runId, usernameAbandoning } = data;
      const { gameOption } = clientApplication.gameContext;
      if (gameOption) {
        gameOption.playersAbandoned.push(usernameAbandoning);
        // if any other players would remain
        const playersWillRemain = gameOption.players.size > 1;
        if (playersWillRemain) {
          // transfer the characters to inheriting character
          gameOption.transferCharactersToInheritingPlayer(usernameAbandoning);
          gameOption.characterControlScheme = CharacterControlScheme.Captain;
        }
        gameOption.players.delete(usernameAbandoning);
        gameOption.playersReadied = [];
      } else {
        // delete the run id from the saved ironman runs list
        clientApplication.lobbyContext.savedIronmanRuns.delete(runId);
        if (clientApplication.lobbyContext.selectedSavedIronmanRun === runId) {
          clientApplication.lobbyContext.selectedSavedIronmanRun = null;
        }
      }
    },
    [GameStateUpdateType.SavedCharacterDeleted]: (data) => {
      lobbyContext.savedCharacters.deleteSavedCharacter(data.entityId);

      clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantModels,
        data: { softCleanup: true, placeInHomePositions: true },
      });
    },
    [GameStateUpdateType.SavedCharacter]: (data) => {
      const { characterControlScheme, character } = data;
      const { combatant, pets } = character;
      const deserializedCombatant = Combatant.fromSerialized(combatant);
      const deserializedPets = pets.map((pet) => Combatant.fromSerialized(pet));

      const existingCharacters =
        lobbyContext.savedCharacters.byControlScheme[characterControlScheme];
      deserializedCombatant.combatantProperties.transformProperties.autoSetHomePosition(
        DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
        existingCharacters.length,
        {
          onCenterLine: true,
          slotSpacingOverride: CHARACTER_SLOT_SPACING,
          reverseOrder: true,
        }
      );

      lobbyContext.savedCharacters.appendCharacter(characterControlScheme, {
        combatant: deserializedCombatant,
        pets: deserializedPets,
      });

      clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientSequentialEventType.SynchronizeCombatantModels,
        data: { softCleanup: true, placeInHomePositions: true },
      });
    },
    [GameStateUpdateType.GameServerConnectionInstructions]: async (data) => {
      clientApplication.topologyManager.transitionToLobbyServer.fire(); // if skipping lobby and reconnecting to game
      const { connectionInstructions } = data;
      const { url, encryptedSessionClaimToken } = connectionInstructions;

      const queryParams = [
        {
          name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
          value: encryptedSessionClaimToken,
        },
      ];

      clientApplication.topologyManager.transitionToGameServer.arm({
        timeoutMs: GAME_SERVER_TRANSITION_TIMEOUT_MS,
        onSuccess: () => {
          connectionEndpoint.close();
        },
        onTimeout: () => {
          clientApplication.alertsService.setAlert(
            new Error("Timed out connecting to game server")
          );
        },
      });

      clientApplication.topologyManager.waitForReconnectionInstructions.fire();
      clientApplication.topologyManager.createGameClient(url, queryParams);
    },

    [GameStateUpdateType.ClientAppMessage]: (messageType) => {
      const messageText = CLIENT_APP_MESSAGES[messageType];
      clientApplication.alertsService.setAlert(messageText);
      if (messageType === ClientAppMessageType.DisconnectedByPreemption) {
        clientApplication.eventLogStore.postMessage(
          new GameLogMessage(messageText, GameLogMessageStyle.PartyWipe)
        );
        clientApplication.topologyManager.enterOffline();
      } else {
        clientApplication.eventLogStore.postMessage(
          new GameLogMessage(messageText, GameLogMessageStyle.Healing)
        );
      }
    },
    [GameStateUpdateType.EndOfUpdateStream]: () => {
      /* handled in BaseClient */
    },
  };
}
