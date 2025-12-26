import SocketIO from "socket.io";
import {
  ClientIntentReceiver,
  ClientIntentType,
  ConnectionId,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { TransportEndpoint } from "@speed-dungeon/common";
import { GameStateUpdate } from "@speed-dungeon/common";

export class SocketTransportEndpoint implements TransportEndpoint {
  id: ConnectionId;
  constructor(private socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>) {
    this.id = this.socket.id as ConnectionId;
  }

  send(update: GameStateUpdate): void {
    this.socket.emit(ServerToClientEvent.GameStateUpdate, update);
  }

  close?(): void {
    this.socket.disconnect();
  }
}

export class LobbyRemoteClientIntentReceiver extends ClientIntentReceiver {
  constructor(private io: SocketIO.Server<ClientToServerEventTypes, ServerToClientEventTypes>) {
    super();
  }

  listen() {
    this.io.of("/").on("connection", async (socket) => {
      const transportEndpoint = new SocketTransportEndpoint(socket);

      this.forwardIntent(
        { type: ClientIntentType.Connection, data: { transport: transportEndpoint } },
        socket.id as ConnectionId
      );

      // socket.on(ClientToServerEvent.ClientIntent, (clientIntent) => {
      //   // this.forwardIntent(clientIntent);
      // });
    });
  }
}
