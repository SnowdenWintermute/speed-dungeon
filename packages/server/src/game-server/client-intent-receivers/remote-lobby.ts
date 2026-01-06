import SocketIO from "socket.io";
import {
  ConnectionId,
  ServerToClientEvent,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  GameStateUpdate,
  ClientIntent,
  ConnectionEndpoint,
  TransportDisconnectReasonType,
  HTTP_HEADER_NAME_STRINGS,
  HttpHeaderNames,
  CONNECTION_ROLE_STRINGS,
  ConnectionRole,
  IncomingMessageGateway,
  ConnectionIdentityResolutionContext,
  RawConnection,
} from "@speed-dungeon/common";

export class UserSocketConnectionEndpoint
  implements ConnectionEndpoint<GameStateUpdate, ClientIntent>
{
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

export class GameServerSocketConnectionEndpoint implements ConnectionEndpoint<string, string> {
  id: ConnectionId;
  constructor(private socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>) {
    this.id = this.socket.id as ConnectionId;
  }
  send(update: string): void {
    this.socket.emit(ServerToClientEvent.MessageToGameServer, update);
  }

  close?(): void {
    this.socket.disconnect();
  }
}

export interface SocketConnectionHeaders {
  cookie?: string;
  [header: string]: string | string[] | undefined;
}

export class LobbyRemoteIncomingMessageGateway extends IncomingMessageGateway {
  constructor(private io: SocketIO.Server) {
    super();
  }

  private getConnectionIdentityContext(
    headers: SocketConnectionHeaders
  ): ConnectionIdentityResolutionContext {
    const cookies = headers.cookie;
    const connectionRole = headers[HTTP_HEADER_NAME_STRINGS[HttpHeaderNames.ConnectionRole]];
    if (typeof connectionRole !== "string") {
      throw new Error("unexpected header content");
    }

    if (connectionRole === CONNECTION_ROLE_STRINGS[ConnectionRole.GameServer]) {
      const handshakePayload = JSON.parse(
        headers[HttpHeaderNames.GameServerToLobbyHandshakePayload]?.toString() || ""
      );
      const handshakeSignature = headers[HttpHeaderNames.GameServerToLobbyHandshakeSignature] || "";
      return {
        type: ConnectionRole.GameServer,
        gameServerId: handshakePayload["gameServerId"],
        gameServerName: handshakePayload["gameServerName"],
        gameServerUrl: handshakePayload["gameServerUrl"],
        expirationTimestamp: handshakePayload["expirationTimestamp"],
        nonce: handshakePayload["nonce"],
        signature: handshakeSignature?.toString(),
      };
    } else if (connectionRole === CONNECTION_ROLE_STRINGS[ConnectionRole.User]) {
      return {
        type: ConnectionRole.User,
        cookies,
      };
    } else {
      throw new Error("Unrecognized connection role");
    }
  }

  listen() {
    this.io.of("/").on("connection", async (socket) => {
      const req = socket.request;
      const identityContext = this.getConnectionIdentityContext(req.headers);

      const rawConnection: RawConnection = {
        id: socket.id as ConnectionId,
        sendRaw: function (payload: unknown): void {
          socket.emit("message", payload);
        },
        onReceiveRaw: function (handler: (payload: unknown) => void): void {
          socket.on("message", handler);
        },
        close: function (): void {
          throw new Error("Function not implemented.");
        },
      };

      this.requireConnectionHandler()(rawConnection, identityContext);

      // socket.on("disconnect", (reason) => {
      //   this.dispatchIntent(
      //     {
      //       type: ClientIntentType.Disconnection,
      //       data: { reason: new TransportDisconnectReason(SOCKET_IO_DISCONNECT_REASONS[reason]) },
      //     },
      //     socket.id as ConnectionId
      //   );
      // });
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
