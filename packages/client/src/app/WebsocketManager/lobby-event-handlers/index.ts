import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ServerToClientEvent,
  SpeedDungeonPlayer,
  AdventuringParty,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import characterAddedToPartyHandler from "./character-added-to-party-handler";
import characterDeletionHandler from "./character-deletion-handler";
import playerToggledReadyToStartGameHandler from "./player-toggled-ready-to-start-game-handler";
import gameStartedHandler from "../game-event-handlers/game-started-handler";
import playerLeftGameHandler from "../player-left-game-handler";
import savedCharacterSelectionInProgressGameHandler from "./saved-character-selection-in-progress-game-handler";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";

export default function setUpGameLobbyEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const mutateGameStore = useGameStore.getState().mutateState;
  socket.on(ServerToClientEvent.GameFullUpdate, (game) => {
    mutateGameStore((state) => {
      if (game === null) {
        state.game = null;
        state.gameName = null;
        gameWorld.current?.drawCharacterSlots();
      } else {
        state.game = game;
        state.gameName = game.name;
      }
    });
  });
  socket.on(ServerToClientEvent.PlayerJoinedGame, (username) => {
    mutateGameStore((state) => {
      if (state.game) state.game.players[username] = new SpeedDungeonPlayer(username);
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

    gameWorld.current?.clearFloorTexture();
  });
  socket.on(ServerToClientEvent.ProgressionGameStartingFloorSelected, (floorNumber) => {
    mutateGameStore((state) => {
      if (state.game) state.game.selectedStartingFloor.current = floorNumber;
    });
  });
}
