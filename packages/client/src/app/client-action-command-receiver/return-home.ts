import { ReturnHomeActionCommandPayload } from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { ActionCommandManager } from "@speed-dungeon/common/src/action-processing/action-command-manager";

export default function returnHomeActionCommandHandler(
  this: ClientActionCommandReceiver,
  actionCommandManager: ActionCommandManager,
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
