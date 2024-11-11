import { ReturnHomeActionCommandPayload } from "@speed-dungeon/common";
import { NextToBabylonMessageTypes } from "@/singletons/next-to-babylon-message-queue";
import { ActionCommandManager } from "@speed-dungeon/common";
import { nextToBabylonMessageQueue } from "@/singletons/next-to-babylon-message-queue";

export default function returnHomeActionCommandHandler(
  _actionCommandManager: ActionCommandManager,
  _gameName: string,
  combatantId: string,
  payload: ReturnHomeActionCommandPayload
) {
  nextToBabylonMessageQueue.messages.push({
    type: NextToBabylonMessageTypes.StartReturningHome,
    actionCommandPayload: payload,
    actionUserId: combatantId,
  });
}
