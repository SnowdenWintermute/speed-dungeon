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
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { HTTP_REQUEST_NAMES } from "@/client_consts";
import { AppStore } from "@/mobx-stores/app-store";

export function setUpGameLobbyEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const { actionMenuStore } = AppStore.get();

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

    const { gameStore } = AppStore.get();
    if (game === null) {
      gameStore.clearGame();
      if (isLoggedIn) gameWorld.current?.drawCharacterSlots();
    } else {
      gameStore.setGame(game);
    }

    actionMenuStore.clearStack();
  });

  socket.on(ServerToClientEvent.PlayerJoinedGame, (username) => {
    const gameOption = AppStore.get().gameStore.getGameOption();
    const player = new SpeedDungeonPlayer(username);
    if (gameOption) gameOption.players[username] = player;
  });

  socket.on(ServerToClientEvent.PlayerLeftGame, playerLeftGameHandler);
  socket.on(ServerToClientEvent.PartyCreated, (partyId, partyName) => {
    const gameOption = AppStore.get().gameStore.getGameOption();
    if (!gameOption) return;
    gameOption.addParty(new AdventuringParty(partyId, partyName));
  });
  socket.on(ServerToClientEvent.PlayerChangedAdventuringParty, (username, partyName) => {
    const gameOption = AppStore.get().gameStore.getGameOption();
    if (!gameOption) return;
    // ignore if game already started. this is a relic of the fact we remove them
    // from their party when leaving a lobby game, but it is an unhandled crash
    // to remove them from a party when still in a game
    if (!gameOption.timeStarted) {
      SpeedDungeonGame.removePlayerFromParty(gameOption, username);
      if (partyName === null) return;
      gameOption.putPlayerInParty(partyName, username);
    }
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
    const gameOption = AppStore.get().gameStore.getGameOption();
    if (gameOption) gameOption.selectedStartingFloor = floorNumber;
  });
}
