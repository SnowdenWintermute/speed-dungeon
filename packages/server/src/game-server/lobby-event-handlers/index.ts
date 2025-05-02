import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "../index.js";
import joinPartyHandler from "./join-party-handler.js";
import { applyMiddlewares } from "../event-middleware/index.js";
import { playerInGame } from "../event-middleware/get-player-associated-data.js";
import createPartyHandler from "./create-party-handler.js";
import { toggleReadyToStartGameHandler } from "./toggle-ready-to-start-game-handler.js";
import leavePartyHandler from "./leave-party-handler.js";
import leaveGameHandler from "./leave-game-handler.js";
import joinGameHandler from "./join-game-handler.js";
import getSession from "../event-middleware/get-session.js";
import createGameHandler from "./create-game-handler.js";
import requestGameListHandler from "./request-game-list-handler.js";
import createCharacterHandler from "./create-character-handler.js";
import deleteCharacterHandler from "./delete-character-handler.js";
import selectProgressionGameCharacterHandler from "./select-progression-game-character-handler.js";
import selectProgressionGameStartingFloorHandler from "./select-progression-game-starting-floor-handler.js";

export default function initiateLobbyEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.RequestsGameList, () => requestGameListHandler(socket));
  socket.on(
    ClientToServerEvent.CreateGame,
    applyMiddlewares(getSession)(socket, createGameHandler)
  );
  socket.on(ClientToServerEvent.JoinGame, applyMiddlewares(getSession)(socket, joinGameHandler));
  socket.on(
    ClientToServerEvent.LeaveGame,
    applyMiddlewares(playerInGame)(socket, leaveGameHandler)
  );
  socket.on(
    ClientToServerEvent.CreateParty,
    applyMiddlewares(playerInGame)(socket, createPartyHandler)
  );
  socket.on(
    ClientToServerEvent.JoinParty,
    applyMiddlewares(playerInGame)(socket, joinPartyHandler)
  );
  socket.on(
    ClientToServerEvent.LeaveParty,
    applyMiddlewares(playerInGame)(socket, leavePartyHandler)
  );
  socket.on(
    ClientToServerEvent.CreateCharacter,
    applyMiddlewares(playerInGame)(socket, createCharacterHandler)
  );
  socket.on(
    ClientToServerEvent.DeleteCharacter,
    applyMiddlewares(playerInGame)(socket, deleteCharacterHandler)
  );
  socket.on(
    ClientToServerEvent.ToggleReadyToStartGame,
    applyMiddlewares(playerInGame)(socket, toggleReadyToStartGameHandler)
  );
  socket.on(
    ClientToServerEvent.SelectSavedCharacterForProgressGame,
    applyMiddlewares(playerInGame)(socket, selectProgressionGameCharacterHandler)
  );
  socket.on(
    ClientToServerEvent.SelectProgressionGameStartingFloor,
    applyMiddlewares(playerInGame)(socket, selectProgressionGameStartingFloorHandler)
  );
}
