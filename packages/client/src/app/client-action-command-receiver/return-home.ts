import { ReturnHomeActionCommandPayload } from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";

export default function returnHomeActionCommandHandler(
  this: ClientActionCommandReceiver,
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
