import SocketIO from "socket.io";
import {
  ClientIntentReceiver,
  ClientIntentType,
  ConnectionId,
  ServerToClientEvent,
  ClientToServerEventTypes,
  ClientToServerEvent,
  ServerToClientEventTypes,
  GameStateUpdate,
  ClientIntent,
  ConnectionEndpoint,
  TransportDisconnectReason,
  TransportDisconnectReasonType,
} from "@speed-dungeon/common";

export class SocketConnectionEndpoint implements ConnectionEndpoint<GameStateUpdate, ClientIntent> {
  id: ConnectionId;
  constructor(private socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>) {
    this.id = this.socket.id as ConnectionId;
  }
  subscribe(type: ClientIntentType) {
    // socket.on()
    // @TODO - figure it out or don't use it
  }

  send(update: GameStateUpdate): void {
    this.socket.emit(ServerToClientEvent.GameStateUpdate, update);
  }

  close?(): void {
    this.socket.disconnect();
  }
}

export class LobbyRemoteClientIntentReceiver extends ClientIntentReceiver<
  ClientIntent,
  GameStateUpdate
> {
  constructor(private io: SocketIO.Server<ClientToServerEventTypes, ServerToClientEventTypes>) {
    super();
  }

  listen() {
    this.io.of("/").on("connection", async (socket) => {
      const transportEndpoint = new SocketConnectionEndpoint(socket);

      const req = socket.request;
      const cookies = req.headers.cookie;

      await this.handleConnection(transportEndpoint, { cookies });

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
