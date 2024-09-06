import { MoveIntoCombatActionPositionActionCommandPayload } from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import { NextToBabylonMessageTypes } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { ActionCommandManager } from "@speed-dungeon/common/src/action-processing/action-command-manager";

export default function moveIntoCombatActionPositionActionCommandHandler(
  this: ClientActionCommandReceiver,
  actionCommandManager: ActionCommandManager,
  _gameName: string,
  combatantId: string,
  payload: MoveIntoCombatActionPositionActionCommandPayload
) {
  // CLIENT
  // - lock/hide this character's ui to show the animation
  // - calculate their destination location and rotation based on payload target and ability type (melee/ranged)
  // - start animating them toward their destination
  // - on reach destination, process the next command

  this.mutateNextBabylonMessagingState((state) => {
    state.nextToBabylonMessages.push({
      type: NextToBabylonMessageTypes.StartMovingCombatantIntoCombatActionPosition,
      actionCommandPayload: payload,
      actionUserId: combatantId,
    });
  });
}
