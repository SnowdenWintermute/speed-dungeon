export enum HttpHeaderNames {
  ConnectionRole, // "user" | "game-server"
  GameServerToLobbyHandshakePayload, // json
  GameServerToLobbyHandshakeSignature, // hmac
}

export const HTTP_HEADER_NAME_STRINGS: Record<HttpHeaderNames, string> = {
  [HttpHeaderNames.ConnectionRole]: "connection-role",
  [HttpHeaderNames.GameServerToLobbyHandshakePayload]: "game-server-to-lobby-handshake-token",
  [HttpHeaderNames.GameServerToLobbyHandshakeSignature]: "game-server-to-lobby-handshake-signature",
};

export enum ConnectionRole {
  User,
  GameServer,
}

export const CONNECTION_ROLE_STRINGS: Record<ConnectionRole, string> = {
  [ConnectionRole.User]: "user",
  [ConnectionRole.GameServer]: "game-server",
};
