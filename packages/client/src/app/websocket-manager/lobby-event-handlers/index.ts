import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ServerToClientEvent,
  SpeedDungeonPlayer,
  AdventuringParty,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import { characterAddedToPartyHandler } from "./character-added-to-party-handler";
import { characterDeletionHandler } from "./character-deletion-handler";
import { playerToggledReadyToStartGameHandler } from "./player-toggled-ready-to-start-game-handler";
import { gameStartedHandler } from "../game-event-handlers/game-started-handler";
import { playerLeftGameHandler } from "../player-left-game-handler";
import { savedCharacterSelectionInProgressGameHandler } from "./saved-character-selection-in-progress-game-handler";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { HTTP_REQUEST_NAMES } from "@/client_consts";

export function setUpGameLobbyEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const mutateGameStore = useGameStore.getState().mutateState;

  socket.on(ServerToClientEvent.GameFullUpdate, (game) => {
    if (game) {
      game = SpeedDungeonGame.getDeserialized(game);
    } else {
      gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.ClearAllModels,
      });
    }

    gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.SynchronizeCombatantModels,
    });
    gameWorld.current?.imageManager.enqueueMessage({
      type: ImageManagerRequestType.ClearState,
    });

    const currentSessionHttpResponseTracker =
      useHttpRequestStore.getState().requests[HTTP_REQUEST_NAMES.GET_SESSION];
    const isLoggedIn = currentSessionHttpResponseTracker?.statusCode === 200;

    mutateGameStore((state) => {
      if (game === null) {
        state.game = null;
        state.gameName = null;
        if (isLoggedIn) gameWorld.current?.drawCharacterSlots();
      } else {
        state.game = game;
        state.gameName = game.name;
      }
      state.stackedMenuStates = [];
    });
  });

  socket.on(ServerToClientEvent.PlayerJoinedGame, (username) => {
    mutateGameStore((state) => {
      const player = new SpeedDungeonPlayer(username);
      if (state.game) state.game.players[username] = player;
    });
  });

  socket.on(ServerToClientEvent.PlayerLeftGame, playerLeftGameHandler);
  socket.on(ServerToClientEvent.PartyCreated, (partyId, partyName) => {
    mutateGameStore((state) => {
      if (state.game) {
        state.game.adventuringParties[partyName] = new AdventuringParty(partyId, partyName);
      }
    });
  });
  socket.on(ServerToClientEvent.PlayerChangedAdventuringParty, (username, partyName) => {
    mutateGameStore((state) => {
      if (!state.game) return;
      // ignore if game already started. this is a relic of the fact we remove them
      // from their party when leaving a lobby game, but it is an unhandled crash
      // to remove them from a party when still in a game
      if (!state.game.timeStarted) {
        SpeedDungeonGame.removePlayerFromParty(state.game, username);
        if (partyName === null) return;
        SpeedDungeonGame.putPlayerInParty(state.game, partyName, username);
      }
    });
  });
  socket.on(ServerToClientEvent.CharacterAddedToParty, characterAddedToPartyHandler);
  socket.on(ServerToClientEvent.CharacterDeleted, characterDeletionHandler);
  socket.on(
    ServerToClientEvent.PlayerSelectedSavedCharacterInProgressionGame,
    savedCharacterSelectionInProgressGameHandler
  );
  socket.on(
    ServerToClientEvent.PlayerToggledReadyToStartGame,
    playerToggledReadyToStartGameHandler
  );
  socket.on(ServerToClientEvent.GameStarted, (timeStarted) => {
    gameStartedHandler(timeStarted);
  });

  socket.on(ServerToClientEvent.ProgressionGameStartingFloorSelected, (floorNumber) => {
    mutateGameStore((state) => {
      if (state.game) state.game.selectedStartingFloor = floorNumber;
    });
  });
}
