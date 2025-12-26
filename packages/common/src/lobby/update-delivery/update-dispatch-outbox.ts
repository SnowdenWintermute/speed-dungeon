import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { ChannelName, ConnectionId } from "../../types.js";
import {
  GameStateUpdateDispatch,
  GameStateUpdateDispatchFactory,
} from "./game-state-update-dispatch-factory.js";

export class GameStateUpdateDispatchOutbox {
  private list: GameStateUpdateDispatch[] = [];
  constructor(private gameUpdateDispatchFactory: GameStateUpdateDispatchFactory) {}

  toDispatches(): readonly GameStateUpdateDispatch[] {
    return this.list;
  }

  pushToConnection(to: ConnectionId, update: GameStateUpdate) {
    this.list.push(this.gameUpdateDispatchFactory.createSingle(to, update));
  }

  pushToChannel(
    inChannel: ChannelName,
    update: GameStateUpdate,
    options?: { excludedIds: ConnectionId[] }
  ) {
    this.list.push(this.gameUpdateDispatchFactory.createFanOut(inChannel, update, options));
  }

  pushFromOther(other: GameStateUpdateDispatchOutbox) {
    this.list.push(...other.toDispatches());
  }
}
