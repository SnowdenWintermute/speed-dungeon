import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeGameInitializationPolicy } from "../game-initialization-policy.js";

export class IronmanGameInitializationPolicy extends GameModeGameInitializationPolicy {
  override async onStartLiveGame(
    game: SpeedDungeonGame
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    return outbox;
  }
}
