import { ChannelName, ConnectionId } from "../../index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";

export enum GameStateUpdateDispatchType {
  Single,
  FanOut,
}

export interface GameStateUpdateDispatchSingle {
  type: GameStateUpdateDispatchType.Single;
  update: GameStateUpdate;
  connectionId: ConnectionId;
}

export interface GameStateUpdateDispatchFanOut {
  type: GameStateUpdateDispatchType.FanOut;
  update: GameStateUpdate;
  connectionIds: ConnectionId[];
}

export type GameStateUpdateDispatch = GameStateUpdateDispatchSingle | GameStateUpdateDispatchFanOut;

export class GameStateUpdateDispatchFactory {
  constructor(private readonly userSessionRegistry: UserSessionRegistry) {}

  createSingle(to: ConnectionId, update: GameStateUpdate): GameStateUpdateDispatchSingle {
    return {
      type: GameStateUpdateDispatchType.Single,
      connectionId: to,
      update,
    };
  }

  createFanOut(
    inChannel: ChannelName,
    update: GameStateUpdate,
    options?: { excludedIds: ConnectionId[] }
  ): GameStateUpdateDispatchFanOut {
    const excludedIds = options?.excludedIds || [];
    const connectionIds = this.userSessionRegistry
      .in(inChannel)
      .filter((id) => !excludedIds.includes(id));

    return {
      type: GameStateUpdateDispatchType.FanOut,
      connectionIds,
      update,
    };
  }
}
