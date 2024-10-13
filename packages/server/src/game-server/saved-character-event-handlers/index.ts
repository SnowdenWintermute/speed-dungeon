import SocketIO from "socket.io";
import {
  ClientToServerEvent,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from "..";

export default function initiateLobbyEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.GetSavedCharactersList, () => {
    //
  });
  socket.on(ClientToServerEvent.GetSavedCharacterById, (entityId) => {
    //
  });
  socket.on(ClientToServerEvent.CreateSavedCharacter, (name, combatantClass) => {
    //
  });
  socket.on(ClientToServerEvent.DeleteSavedCharacter, (entityId) => {
    //
  });
}
