import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "../index.js";
import joinPartyHandler from "./join-party-handler.js";
import { applyMiddlewares } from "../event-middleware/index.js";
import { getPlayerAssociatedData } from "../event-middleware/get-player-associated-data.js";
import createPartyHandler from "./create-party-handler.js";
import toggleReadyToStartGameHandler from "./toggle-ready-to-start-game-handler.js";

export default function initiateLobbyEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.RequestsGameList, () => {
    this.requestGameListHandler(socket);
  });
  socket.on(ClientToServerEvent.CreateGame, (gameName, gameMode) => {
    this.createGameHandler(socket.id, gameName, gameMode);
  });
  socket.on(ClientToServerEvent.JoinGame, (gameName) => {
    this.joinGameHandler(socket.id, gameName);
  });
  socket.on(ClientToServerEvent.LeaveGame, () => {
    this.leaveGameHandler(socket.id);
  });
  socket.on(
    ClientToServerEvent.CreateParty,
    applyMiddlewares(getPlayerAssociatedData)(socket, createPartyHandler)
  );
  socket.on(
    ClientToServerEvent.JoinParty,
    applyMiddlewares(getPlayerAssociatedData)(socket, joinPartyHandler)
  );
  socket.on(ClientToServerEvent.LeaveParty, () => {
    this.leavePartyHandler(socket.id);
  });
  socket.on(ClientToServerEvent.CreateCharacter, (characterName, combatantClass) => {
    this.createCharacterHandler(socket.id, characterName, combatantClass);
  });
  socket.on(ClientToServerEvent.DeleteCharacter, (characterId) => {
    this.deleteCharacterHandler(socket.id, characterId);
  });
  socket.on(
    ClientToServerEvent.ToggleReadyToStartGame,
    applyMiddlewares(getPlayerAssociatedData)(socket, toggleReadyToStartGameHandler)
  );
  socket.on(ClientToServerEvent.SelectSavedCharacterForProgressGame, (entityId) => {
    this.selectProgressionGameCharacterHandler(socket.id, entityId);
  });
  socket.on(ClientToServerEvent.SelectProgressionGameStartingFloor, (floorNumber) => {
    this.selectProgressionGameStartingFloorHandler(socket.id, floorNumber);
  });
}
