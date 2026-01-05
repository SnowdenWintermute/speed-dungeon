import { GameServerSessionClaimToken } from "./session-claim-token.js";

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
  sessionClaimToken: GameServerSessionClaimToken;
}

export type GameServerConnectionInstructions =
  | LocalGameServerConnectionInstructions
  | RemoteGameServerConnectionInstructions;
