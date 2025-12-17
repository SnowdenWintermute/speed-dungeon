import { EntityMotionUpdateCommand } from "@speed-dungeon/common";
import { handleEntityMotionUpdate } from "./handle-entity-motion-update";
import { GameUpdateTracker } from "../game-update-tracker";

export async function entityMotionGameUpdateHandler(
  updateTracker: GameUpdateTracker<EntityMotionUpdateCommand>
) {
  const { mainEntityUpdate, auxiliaryUpdates } = updateTracker.command;

  handleEntityMotionUpdate(updateTracker, mainEntityUpdate, true);

  if (auxiliaryUpdates) {
    for (const auxiliaryUpdate of auxiliaryUpdates) {
      handleEntityMotionUpdate(updateTracker, auxiliaryUpdate, false);
    }
  }
}
