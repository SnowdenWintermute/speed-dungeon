import { ERROR_MESSAGES, ActionEntityMotionGameUpdateCommand } from "@speed-dungeon/common";
import { gameWorld } from "../../../SceneManager";
import { handleEntityMotionUpdate } from "./handle-entity-motion-update";

export function actionEntityMotionGameUpdateHandler(update: {
  command: ActionEntityMotionGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  const { mainEntityUpdate } = command;

  if (mainEntityUpdate.startPointingTowardCombatantOption) {
    const { actionEntityId, targetId, duration } =
      mainEntityUpdate.startPointingTowardCombatantOption;
    const actionEntityModelOption = gameWorld.current?.actionEntityManager.models[actionEntityId];
    if (!actionEntityModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_ACTION_ENTITY_MODEL);

    actionEntityModelOption.movementManager.transformNode.setParent(null);
    actionEntityModelOption.startPointingTowardsCombatant(targetId, duration);
  }

  const onTranslationComplete = () => {
    if (mainEntityUpdate.despawnOnComplete)
      gameWorld.current?.actionEntityManager.unregister(mainEntityUpdate.entityId);
  };
  const onAnimationComplete = () => {};

  handleEntityMotionUpdate(
    update,
    command.mainEntityUpdate,
    onTranslationComplete,
    onAnimationComplete
  );
}
