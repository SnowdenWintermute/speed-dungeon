import SocketIO from "socket.io";
import {
  HTTP_HEADER_NAME_STRINGS,
  HttpHeaderNames,
  CONNECTION_ROLE_STRINGS,
  ConnectionRole,
  ConnectionIdentityResolutionContext,
  IncomingMessageGateway,
  UntypedSocketConnectionEndpoint,
} from "@speed-dungeon/common";

export interface SocketHandshakeData {
  cookie?: string;
  [header: string]: string | string[] | undefined;
}

export class LobbyRemoteIncomingMessageGateway extends IncomingMessageGateway {
  constructor(private io: SocketIO.Server) {
    super();
  }

  private parseConnectionIdentityContext(
    handshakeData: SocketHandshakeData
  ): ConnectionIdentityResolutionContext {
    const cookies = handshakeData.cookie;
    const connectionRole = handshakeData[HTTP_HEADER_NAME_STRINGS[HttpHeaderNames.ConnectionRole]];

    console.log("connection role in headers:", connectionRole);

    if (typeof connectionRole !== "string") {
      throw new Error("unexpected header content");
    }

    if (connectionRole === CONNECTION_ROLE_STRINGS[ConnectionRole.GameServer]) {
      const handshakePayload = JSON.parse(
        handshakeData[HttpHeaderNames.GameServerToLobbyHandshakePayload]?.toString() || ""
      );
      const handshakeSignature =
        handshakeData[HttpHeaderNames.GameServerToLobbyHandshakeSignature] || "";
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
      console.log(
        "headers:",
        req.headers,
        "rawheaders:",
        req.rawHeaders,
        "distinct:",
        req.headersDistinct
      );
      const identityContext = this.parseConnectionIdentityContext({
        ...socket.handshake.query,
        cookie: req.headers.cookie,
      });

      const untypedEndpoint = new UntypedSocketConnectionEndpoint(socket);
      await this.requireConnectionHandler()(untypedEndpoint, identityContext);
    });
  }
}
