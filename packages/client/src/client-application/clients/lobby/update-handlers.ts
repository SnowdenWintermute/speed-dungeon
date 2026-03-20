import { setAlert } from "@/app/components/alerts";
import {
  AdventuringParty,
  Combatant,
  ConnectionEndpoint,
  ERROR_MESSAGES,
  GameMode,
  GameStateUpdateMap,
  GameStateUpdateType,
  getProgressionGamePartyName,
  MapUtils,
  QUERY_PARAMS,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { getApplicationRuntimeManager } from "@/singletons";
import { ClientApplication } from "@/client-application";
import { gameFullUpdateHandler } from "../common/game-full-update-handler";
import { ClientEventType } from "@/client-application/sequential-client-event-processor/client-events";

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
    [GameStateUpdateType.ErrorMessage]: (data) => {
      setAlert(data.message);
    },
    [GameStateUpdateType.OnConnection]: (data) => {
      session.setUsername(data.username);
    },
    [GameStateUpdateType.ChannelFullUpdate]: (data) => {
      const deserialized = MapUtils.deserialize(data.users, (v) => v);
      lobbyContext.channel.update(deserialized);
    },
    [GameStateUpdateType.UserJoinedChannel]: (data) =>
      lobbyContext.channel.handleUserJoined(data.username, data.userChannelDisplayData),
    [GameStateUpdateType.UserLeftChannel]: (data) =>
      lobbyContext.channel.handleUserLeft(data.username),
    [GameStateUpdateType.GameList]: (data) => lobbyContext.setGameList(data.gameList),
    [GameStateUpdateType.GameFullUpdate]: (data) => {
      gameFullUpdateHandler(clientApplication, data.game);
    },
    [GameStateUpdateType.PlayerJoinedGame]: (data) => {
      const { gameOption } = gameContext;
      const player = new SpeedDungeonPlayer(data.username);
      if (gameOption) {
        gameOption.addPlayer(player);
      }
    },

    [GameStateUpdateType.PlayerLeftGame]: (data) => {
      const { username } = data;
      clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientEventType.RemovePlayerFromGame,
        data: { username },
      });

      const { gameOption } = gameContext;
      if (!gameOption) {
        return;
      }

      const maxStartingFloor = gameOption.getMaxStartingFloor();

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
          type: ClientEventType.SynchronizeCombatantModels,
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
      const deserialized = {
        combatant: Combatant.fromSerialized(character.combatant),
        pets: character.pets.map((pet) => Combatant.fromSerialized(pet)),
      };

      game.lowestStartingFloorOptionsBySavedCharacter.set(
        character.combatant.entityProperties.id,
        character.combatant.combatantProperties.deepestFloorReached
      );

      const partyName = getProgressionGamePartyName(game.name);
      const party = game.adventuringParties.get(partyName);
      if (!party) {
        return setAlert(new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST));
      }
      const player = game.getPlayer(username);
      if (!player) {
        return setAlert(new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));
      }

      const previouslySelectedCharacterId = player.characterIds[0];
      if (previouslySelectedCharacterId) {
        const removedCharacterResult = party.removeCharacter(
          previouslySelectedCharacterId,
          player,
          game
        );
        game.lowestStartingFloorOptionsBySavedCharacter.delete(
          removedCharacterResult.entityProperties.id
        );
        party.combatantManager.updateHomePositions();
      }

      game.addCharacterToParty(party, player, deserialized.combatant, deserialized.pets);

      clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientEventType.SynchronizeCombatantModels,
        data: { softCleanup: true, placeInHomePositions: true },
      });
    },
    [GameStateUpdateType.PlayerToggledReadyToStartGame]: (data) => {
      const game = gameContext.requireGame();
      game.togglePlayerReadyToStartGameStatus(data.username);
    },
    [GameStateUpdateType.ProgressionGameStartingFloorSelected]: (data) => {
      const { gameOption } = gameContext;
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
              combatant: Combatant.fromSerialized(characterOption.combatant),
              pets: characterOption.pets.map((pet) => Combatant.fromSerialized(pet)),
            };
          }
        }

        lobbyContext.savedCharacters.setSlots(deserialized);

        gameWorldView?.environment.groundPlane.drawCharacterSlots();

        clientApplication.sequentialEventProcessor.scheduleEvent({
          type: ClientEventType.SynchronizeCombatantModels,
          data: { softCleanup: true, placeInHomePositions: true },
        });
      }
    },
    [GameStateUpdateType.SavedCharacterDeleted]: (data) => {
      lobbyContext.savedCharacters.deleteSavedCharacter(data.entityId);

      clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientEventType.SynchronizeCombatantModels,
        data: { softCleanup: true, placeInHomePositions: true },
      });
    },
    [GameStateUpdateType.SavedCharacter]: (data) => {
      const { character, slotIndex } = data;
      const { combatant, pets } = character;
      const deserializedCombatant = Combatant.fromSerialized(combatant);
      const deserializedPets = pets.map((pet) => Combatant.fromSerialized(pet));

      lobbyContext.savedCharacters.setSlot(
        { combatant: deserializedCombatant, pets: deserializedPets },
        slotIndex
      );

      clientApplication.sequentialEventProcessor.scheduleEvent({
        type: ClientEventType.SynchronizeCombatantModels,
        data: { softCleanup: true, placeInHomePositions: true },
      });
    },
    [GameStateUpdateType.GameServerConnectionInstructions]: (data) => {
      const { connectionInstructions } = data;
      const { url, encryptedSessionClaimToken } = connectionInstructions;

      connectionEndpoint.close();

      const queryParams = [
        {
          name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
          value: encryptedSessionClaimToken,
        },
      ];

      getApplicationRuntimeManager().createGameClient(url, queryParams);
    },
  };
}
