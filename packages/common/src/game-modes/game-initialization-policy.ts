import { SpeedDungeonGame } from "../game/index.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { MessageDispatchFactory } from "../servers/update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../servers/update-delivery/outbox.js";

export class GameModeGameInitializationPolicy {
  constructor(protected messageDispatchFactory: MessageDispatchFactory<GameStateUpdate>) {}
  async onStartLiveGame(_game: SpeedDungeonGame): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    return new MessageDispatchOutbox(this.messageDispatchFactory);
  }
}
