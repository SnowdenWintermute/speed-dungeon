import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "..";

export default function initiateGameEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.ToggleReadyToExplore, () => {
    this.emitErrorEventIfError(socket, () => this.toggleReadyToExploreHandler(socket.id));
  });
}
