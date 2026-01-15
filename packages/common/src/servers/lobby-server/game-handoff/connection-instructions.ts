export enum GameServerConnectionType {
  Local,
  Remote,
}

export interface LocalGameServerConnectionInstructions {
  type: GameServerConnectionType.Local;
}

export interface RemoteGameServerConnectionInstructions {
  type: GameServerConnectionType.Remote;
  url: string;
  encryptedSessionClaimToken: string;
}

export type GameServerConnectionInstructions =
  | LocalGameServerConnectionInstructions
  | RemoteGameServerConnectionInstructions;
