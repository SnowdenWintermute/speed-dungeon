import { GameName, SessionClaimId } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { PendingGameServerUserSession } from "../servers/lobby-server/game-handoff/pending-user-session.js";

export enum ServerToServerMessageType {
  GameHandoff,
  GameServerReady,
}

export interface ServerToServerMessageMap {
  [ServerToServerMessageType.GameHandoff]: {
    game: SpeedDungeonGame;
    pendingSessionsByClaimId: Map<SessionClaimId, PendingGameServerUserSession>;
  };
  [ServerToServerMessageType.GameServerReady]: {
    gameName: GameName;
  };
}

export type ServerToServerMessage = {
  [K in keyof ServerToServerMessageMap]: {
    type: K;
    data: ServerToServerMessageMap[K];
  };
}[keyof ServerToServerMessageMap];
