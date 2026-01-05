import { GameName, SessionClaimId } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { PendingGameServerUserSession } from "../servers/lobby-server/game-handoff/pending-user-session.js";

export enum ServerToServerPacketType {
  GameHandoff,
  GameServerReady,
}

export interface ServerToServerPacketMap {
  [ServerToServerPacketType.GameHandoff]: {
    game: SpeedDungeonGame;
    pendingSessionsByClaimId: Map<SessionClaimId, PendingGameServerUserSession>;
  };
  [ServerToServerPacketType.GameServerReady]: {
    gameName: GameName;
  };
}

export type ServerToServerPacket = {
  [K in keyof ServerToServerPacketMap]: {
    type: K;
    data: ServerToServerPacketMap[K];
  };
}[keyof ServerToServerPacketMap];

export type ServerToServerPacketHandler<K extends keyof ServerToServerPacketMap> = (
  intent: ServerToServerPacketMap[K]
) => void;

export type ServerToServerPacketHandlers = {
  [K in keyof ServerToServerPacketMap]: ServerToServerPacketHandler<K>;
};
