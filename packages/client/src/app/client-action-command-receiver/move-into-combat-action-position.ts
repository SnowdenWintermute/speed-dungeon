import { MoveIntoCombatActionPositionActionCommandPayload } from "@speed-dungeon/common";
import {
  NextToBabylonMessageTypes,
  nextToBabylonMessageQueue,
} from "@/singletons/next-to-babylon-message-queue";
import { ActionCommandManager } from "@speed-dungeon/common";

export default function moveIntoCombatActionPositionActionCommandHandler(
  _actionCommandManager: ActionCommandManager,
  _gameName: string,
  combatantId: string,
  payload: MoveIntoCombatActionPositionActionCommandPayload
) {
  // CLIENT
  // - lock/hide this character's ui to show the animation
  // - calculate their destination location and rotation based on payload target and ability type (melee/ranged)
  // - start animating them toward their destination
  // - on reach destination, process the next command

  nextToBabylonMessageQueue.messages.push({
    type: NextToBabylonMessageTypes.StartMovingCombatantIntoCombatActionPosition,
    actionCommandPayload: payload,
    actionUserId: combatantId,
  });
}
