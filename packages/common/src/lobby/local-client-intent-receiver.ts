import { ClientIntent } from "../packets/client-intents.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { LocalConnectionEndpointManager } from "../transport/local-connection-endpoint-manager.js";
import { ClientIntentReceiver } from "./client-intent-receiver.js";

export class LobbyLocalClientIntentReceiver extends ClientIntentReceiver {
  constructor(
    private localServerConnectionEndpointManager: LocalConnectionEndpointManager<
      GameStateUpdate,
      ClientIntent
    >
  ) {
    super();
  }

  listen() {
    this.localServerConnectionEndpointManager.setNewConnectionHandler(async (connection) => {
      console.log("connection:", connection.id);

      await this.handleConnection(connection, {});

      connection.subscribeAll((intent) => {
        this.dispatchIntent(intent, connection.id);
      });
    });
  }
}

// this.io.of("/").on("connection", async (socket) => {
//   console.log("remote lobby is listening");
//   const transportEndpoint = new SocketConnectionEndpoint(socket);
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
