import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
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
import { AlertState } from "@/stores/alert-store";
import playerLeftGameHandler from "../player-left-game-handler";
import savedCharacterSelectionInProgressGameHandler from "./saved-character-selection-in-progress-game-handler";

export default function setUpGameLobbyEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  mutateGameStore: MutateState<GameState>,
  mutateAlertStore: MutateState<AlertState>
) {
  socket.on(ServerToClientEvent.GameFullUpdate, (game) => {
    console.log("got full game update: ", game?.selectedStartingFloor);
    mutateGameStore((state) => {
      if (game === null) {
        state.game = null;
        state.gameName = null;
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
  socket.on(ServerToClientEvent.PlayerLeftGame, (username) => {
    playerLeftGameHandler(mutateGameStore, username);
  });
  socket.on(ServerToClientEvent.PartyCreated, (partyName) => {
    mutateGameStore((state) => {
      if (state.game) {
        state.game.adventuringParties[partyName] = new AdventuringParty(partyName);
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
  socket.on(ServerToClientEvent.CharacterAddedToParty, (partyName, username, character) => {
    characterAddedToPartyHandler(mutateGameStore, mutateAlertStore, partyName, username, character);
  });
  socket.on(ServerToClientEvent.CharacterDeleted, (partyName, username, characterId) => {
    characterDeletionHandler(mutateGameStore, mutateAlertStore, partyName, username, characterId);
  });
  socket.on(
    ServerToClientEvent.PlayerSelectedSavedCharacterInProgressionGame,
    (username, character) => {
      savedCharacterSelectionInProgressGameHandler(
        mutateGameStore,
        mutateAlertStore,
        username,
        character
      );
    }
  );
  socket.on(ServerToClientEvent.PlayerToggledReadyToStartGame, (username) => {
    playerToggledReadyToStartGameHandler(mutateGameStore, mutateAlertStore, username);
  });
  socket.on(ServerToClientEvent.GameStarted, (timeStarted) => {
    gameStartedHandler(mutateGameStore, timeStarted);
  });
  socket.on(ServerToClientEvent.ProgressionGameStartingFloorSelected, (floorNumber) => {
    mutateGameStore((state) => {
      if (state.game) state.game.selectedStartingFloor.current = floorNumber;
    });
  });
}
