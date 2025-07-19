import { EntityMotionUpdateCommand } from "@speed-dungeon/common";
import { handleEntityMotionUpdate } from "./handle-entity-motion-update";

export async function entityMotionGameUpdateHandler(update: {
  command: EntityMotionUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  const { mainEntityUpdate, auxiliaryUpdates } = command;

  console.log("mainEntityUpdate: ", mainEntityUpdate, "auxiliaryUpdates", auxiliaryUpdates);

  handleEntityMotionUpdate(update, mainEntityUpdate, true);

  if (auxiliaryUpdates) {
    for (const auxiliaryUpdate of auxiliaryUpdates) {
      handleEntityMotionUpdate(update, auxiliaryUpdate, false);
    }
  }
}
