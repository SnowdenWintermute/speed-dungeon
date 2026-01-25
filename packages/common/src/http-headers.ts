// this is a relic of when we thought it would be a good idea
// to have game servers connect directly to the lobby server
// we have abandoned that in favor of writing to a shared central
// store that both lobby and game servers can reference

export enum HttpHeaderNames {
  ConnectionRole, // "user" | "game-server"
}

export const HTTP_HEADER_NAME_STRINGS: Record<HttpHeaderNames, string> = {
  [HttpHeaderNames.ConnectionRole]: "connection-role",
};
