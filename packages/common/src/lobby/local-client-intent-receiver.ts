import { ConnectionId } from "../aliases.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { ClientIntentReceiver } from "./client-intent-receiver.js";
import { TransportEndpoint } from "./update-delivery/transport-endpoint.js";

export class LocalTransportEndpoint implements TransportEndpoint {
  // id: ConnectionId;
  constructor(public id: ConnectionId) {
    // this.id = this.socket.id as ConnectionId;
  }

  send(update: GameStateUpdate): void {
    // this.socket.emit(ServerToClientEvent.GameStateUpdate, update);
  }

  close?(): void {
    // this.socket.disconnect();
  }
}

export class LobbyRemoteClientIntentReceiver extends ClientIntentReceiver {
  listen() {
    // this.io.of("/").on("connection", async (socket) => {
    //   console.log("remote lobby is listening");
    //   const transportEndpoint = new SocketTransportEndpoint(socket);
    //   const req = socket.request;
    //   const cookies = req.headers.cookie;
    //   this.handleConnection(transportEndpoint, { cookies });
    //   socket.on(ClientToServerEvent.ClientIntent, (clientIntent) => {
    //     this.dispatchIntent(clientIntent, socket.id as ConnectionId);
    //   });
    //   socket.on("disconnect", (reason) => {
    //     this.dispatchIntent(
    //       {
    //         type: ClientIntentType.Disconnection,
    //         data: { reason: new TransportDisconnectReason(SOCKET_IO_DISCONNECT_REASONS[reason]) },
    //       },
    //       socket.id as ConnectionId
    //     );
    //   });
    // });
  }
}
