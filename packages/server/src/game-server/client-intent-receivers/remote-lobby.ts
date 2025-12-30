import SocketIO from "socket.io";
import {
  ClientIntentReceiver,
  ClientIntentType,
  ConnectionId,
  ServerToClientEvent,
  TransportDisconnectReason,
  TransportDisconnectReasonType,
  ClientToServerEventTypes,
  ClientToServerEvent,
  ServerToClientEventTypes,
  TransportEndpoint,
  GameStateUpdate,
} from "@speed-dungeon/common";

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
      console.log("remote lobby is listening");
      const transportEndpoint = new SocketTransportEndpoint(socket);

      const req = socket.request;
      const cookies = req.headers.cookie;

      this.handleConnection(transportEndpoint, { cookies });

      socket.on(ClientToServerEvent.ClientIntent, (clientIntent) => {
        this.dispatchIntent(clientIntent, socket.id as ConnectionId);
      });

      socket.on("disconnect", (reason) => {
        this.dispatchIntent(
          {
            type: ClientIntentType.Disconnection,
            data: { reason: new TransportDisconnectReason(SOCKET_IO_DISCONNECT_REASONS[reason]) },
          },
          socket.id as ConnectionId
        );
      });
    });
  }
}

const SOCKET_IO_DISCONNECT_REASONS: Record<
  SocketIO.DisconnectReason,
  TransportDisconnectReasonType
> = {
  "transport error": TransportDisconnectReasonType.TransportError,
  "transport close": TransportDisconnectReasonType.TransportClose,
  "forced close": TransportDisconnectReasonType.ForcedClose,
  "ping timeout": TransportDisconnectReasonType.PingTimeout,
  "parse error": TransportDisconnectReasonType.ParseError,
  "server shutting down": TransportDisconnectReasonType.ServerShuttingDown,
  "forced server close": TransportDisconnectReasonType.ForcedServerClose,
  "client namespace disconnect": TransportDisconnectReasonType.ClientNamespaceDisconnect,
  "server namespace disconnect": TransportDisconnectReasonType.ServerNamespaceDisconnect,
};
