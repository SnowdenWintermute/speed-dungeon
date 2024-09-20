import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  GameListEntry,
  ServerToClientEvent,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "../index.js";

export default function initiateLobbyEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.RequestsGameList, () => {
    const gameList: GameListEntry[] = this.games
      .entries()
      .map(
        ([gameName, game]) =>
          new GameListEntry(gameName, Object.keys(game.players).length, game.timeStarted)
      );
    socket.emit(ServerToClientEvent.GameList, gameList);
  });
  socket.on(ClientToServerEvent.CreateGame, (gameName) => {
    this.createGameHandler(socket.id, gameName);
  });
  socket.on(ClientToServerEvent.JoinGame, (gameName) => {
    this.joinGameHandler(socket.id, gameName);
  });
  socket.on(ClientToServerEvent.LeaveGame, () => {
    this.leaveGameHandler(socket.id);
  });
  socket.on(ClientToServerEvent.CreateParty, (partyName) => {
    this.createPartyHandler(socket.id, partyName);
  });
  socket.on(ClientToServerEvent.JoinParty, (partyName) => {
    this.joinPartyHandler(socket.id, partyName);
  });
  socket.on(ClientToServerEvent.LeaveParty, () => {
    this.leavePartyHandler(socket.id);
  });
  socket.on(ClientToServerEvent.CreateCharacter, (characterName, combatantClass) => {
    this.createCharacterHandler(socket.id, characterName, combatantClass);
  });
  socket.on(ClientToServerEvent.DeleteCharacter, (characterId) => {
    this.deleteCharacterHandler(socket.id, characterId);
  });
  socket.on(ClientToServerEvent.ToggleReadyToStartGame, () => {
    this.toggleReadyToStartGameHandler(socket.id);
  });
}
