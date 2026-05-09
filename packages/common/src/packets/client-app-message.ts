export enum ClientAppMessageType {
  DisconnectedByPreemption,
  OtherConnectionPreempted,
  ReconnectingToGameServer,
}

export const CLIENT_APP_MESSAGES: Record<ClientAppMessageType, string> = {
  [ClientAppMessageType.DisconnectedByPreemption]:
    "Your client was disconnected because another client connected with the same user ID",
  [ClientAppMessageType.OtherConnectionPreempted]:
    "You have taken over the connection from another client that was connected with your user ID",
  [ClientAppMessageType.ReconnectingToGameServer]: "Reconnecting to game server...",
};
