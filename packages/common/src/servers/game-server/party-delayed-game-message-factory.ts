import { ChannelName } from "../../aliases.js";
import { GameMessage, GameMessageType } from "../../packets/game-message.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { MessageDispatchFactory } from "../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

export class PartyDelayedGameMessageFactory {
  constructor(private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>) {}

  createMessageInGameWithOptionalDelayForParty(
    gameChannel: ChannelName,
    gameMessageType: GameMessageType,
    gameMessageText: string,
    partyChannelToDelayReceipt?: ChannelName
  ) {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    const excludedChannels: ChannelName[] = [];

    if (partyChannelToDelayReceipt) {
      excludedChannels.push(partyChannelToDelayReceipt);
      outbox.pushToChannel(partyChannelToDelayReceipt, {
        type: GameStateUpdateType.GameMessage,
        data: { message: new GameMessage(gameMessageType, true, gameMessageText) },
      });
    }

    outbox.pushToChannel(
      gameChannel,
      {
        type: GameStateUpdateType.GameMessage,
        data: { message: new GameMessage(gameMessageType, false, gameMessageText) },
      },
      { excludedChannels }
    );

    return outbox;
  }
}
