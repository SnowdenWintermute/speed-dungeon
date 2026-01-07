import { InMemoryConnectionEndpointManager } from "../transport/in-memory-connection-endpoint-manager.js";
import { IncomingMessageGateway } from "./incoming-message-gateway.js";

export class InMemoryIncomingMessageGateway extends IncomingMessageGateway {
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
