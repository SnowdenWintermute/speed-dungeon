import { PerformCombatActionActionCommandPayload } from "@speed-dungeon/common";
import { ActionCommandManager } from "@speed-dungeon/common";
import {
  NextToBabylonMessageTypes,
  nextToBabylonMessageQueue,
} from "@/singletons/next-to-babylon-message-queue";

export default function performCombatActionActionCommandHandler(
  _actionCommandManager: ActionCommandManager,
  _gameName: string,
  combatantId: string,
  payload: PerformCombatActionActionCommandPayload
) {
  nextToBabylonMessageQueue.messages.push({
    type: NextToBabylonMessageTypes.StartPerformingCombatAction,
    actionCommandPayload: payload,
    actionUserId: combatantId,
  });
}
