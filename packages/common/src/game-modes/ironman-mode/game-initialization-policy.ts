import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeGameInitializationPolicy } from "../game-initialization-policy.js";

export class IronmanGameInitializationPolicy extends GameModeGameInitializationPolicy {
  override async onStartLiveGame(
    game: SpeedDungeonGame
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    // @TODO - if is continued game, adjust the speedrun timing clocks
    // - On game start, set the party.timeCurrentFloorReached to something like it was reached at a time in the past equal to
    //   the time it had been from when it was really reached to the time the game was saved
    return outbox;
  }
}
