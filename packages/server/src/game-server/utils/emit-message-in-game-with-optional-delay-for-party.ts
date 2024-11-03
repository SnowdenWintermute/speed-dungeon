import {
  GameMessage,
  GameMessageType,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";

/** We sometimes want to delay a message to a certain party if they are still
 * playing back their combat action results. We wouldn't want them to get the message
 * that they wiped until those results are done animating. Everyone else can be told instantly */
export default function emitMessageInGameWithOptionalDelayForParty(
  gameName: string,
  gameMessageType: GameMessageType,
  gameMessageText: string,
  partyNameToDelayReceipt?: string
) {
  if (!partyNameToDelayReceipt) {
    console.log("emitted game message");
    getGameServer()
      .io.in(gameName)
      .emit(
        ServerToClientEvent.GameMessage,
        new GameMessage(gameMessageType, false, gameMessageText)
      );
  } else {
    const partyChannel = getPartyChannelName(gameName, partyNameToDelayReceipt);
    getGameServer()
      .io.in(gameName)
      .except(partyChannel)
      .emit(
        ServerToClientEvent.GameMessage,
        new GameMessage(gameMessageType, false, gameMessageText)
      );

    getGameServer()
      .io.in(partyChannel)
      .emit(
        ServerToClientEvent.GameMessage,
        new GameMessage(gameMessageType, true, gameMessageText)
      );
  }
}
