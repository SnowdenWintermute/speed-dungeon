import { ReturnHomeActionCommandPayload } from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from "./index.js";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { ActionCommandManager } from "@speed-dungeon/common";

export default function returnHomeActionCommandHandler(
  this: ClientActionCommandReceiver,
  _actionCommandManager: ActionCommandManager,
  _gameName: string,
  combatantId: string,
  payload: ReturnHomeActionCommandPayload
) {
  this.mutateNextBabylonMessagingState((state) => {
    state.nextToBabylonMessages.push({
      type: NextToBabylonMessageTypes.StartReturningHome,
      actionCommandPayload: payload,
      actionUserId: combatantId,
    });
  });
}
