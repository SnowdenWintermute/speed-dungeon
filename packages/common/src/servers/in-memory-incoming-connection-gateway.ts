import { InMemoryConnectionEndpointManager } from "../transport/in-memory-connection-endpoint-manager.js";
import { IncomingConnectionGateway } from "./incoming-connection-gateway.js";

export class InMemoryIncomingConnectionGateway extends IncomingConnectionGateway {
  constructor(private localServerConnectionEndpointManager: InMemoryConnectionEndpointManager) {
    super();
  }

  listen() {
    this.localServerConnectionEndpointManager.setNewConnectionHandler(
      async (connection, identityContext) => {
        await this.requireConnectionHandler()(connection, identityContext);
      }
    );
  }
}

// this.io.of("/").on("connection", async (socket) => {
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
