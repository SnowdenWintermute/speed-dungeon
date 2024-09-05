import { PerformCombatActionActionCommandPayload } from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";

export default function performCombatActionActionCommandHandler(
  this: ClientActionCommandReceiver,
  _gameName: string,
  combatantId: string,
  payload: PerformCombatActionActionCommandPayload
) {
  this.mutateNextBabylonMessagingState((state) => {
    state.nextToBabylonMessages.push({
      type: NextToBabylonMessageTypes.StartPerformingCombatAction,
      actionCommandPayload: payload,
      actionUserId: combatantId,
    });
  });
}
