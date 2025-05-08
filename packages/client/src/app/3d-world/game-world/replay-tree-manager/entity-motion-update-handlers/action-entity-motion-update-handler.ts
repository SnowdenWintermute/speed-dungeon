import {
  ERROR_MESSAGES,
  COMBAT_ACTIONS,
  ActionEntityMotionGameUpdateCommand,
} from "@speed-dungeon/common";
import { gameWorld } from "../../../SceneManager";
import { Quaternion } from "@babylonjs/core";
import { plainToInstance } from "class-transformer";
import { handleStepCosmeticEffects } from "../handle-step-cosmetic-effects";
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { handleUpdateTranslation } from "./handle-update-translation";
import { handleUpdateAnimation } from "./handle-update-animation";

export function actionEntityMotionGameUpdateHandler(update: {
  command: ActionEntityMotionGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  const { mainEntityUpdate } = command;
  const { entityId, translationOption, rotationOption, animationOption } = mainEntityUpdate;

  const toUpdate = getSceneEntityToUpdate(mainEntityUpdate);
  const { movementManager, animationManager, cosmeticEffectManager } = toUpdate;

  if (mainEntityUpdate.startPointingTowardCombatantOption) {
    const { actionEntityId, targetId, duration } =
      mainEntityUpdate.startPointingTowardCombatantOption;
    const actionEntityModelOption = gameWorld.current?.actionEntityManager.models[actionEntityId];
    if (!actionEntityModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_ACTION_ENTITY_MODEL);

    actionEntityModelOption.movementManager.transformNode.setParent(null);
    actionEntityModelOption.startPointingTowardsCombatant(targetId, duration);
    console.log("strated topoint at ", entityId);
    // destinationYOption = targetBoundingBoxCenter.y;
  }

  const action = COMBAT_ACTIONS[command.actionName];

  handleStepCosmeticEffects(action, command.step, cosmeticEffectManager, entityId);

  // console.log("destinationOption: ", translationOption?.destination);

  const updateCompletionTracker = new EntityMotionUpdateCompletionTracker(
    animationOption,
    !!translationOption
  );

  handleUpdateTranslation(
    movementManager,
    translationOption,
    updateCompletionTracker,
    update,
    () => {
      if (mainEntityUpdate.despawnOnComplete)
        gameWorld.current?.actionEntityManager.unregister(mainEntityUpdate.entityId);
    }
  );

  if (rotationOption)
    movementManager.startRotatingTowards(
      plainToInstance(Quaternion, rotationOption.rotation),
      rotationOption.duration,
      () => {}
    );

  handleUpdateAnimation(
    animationManager,
    animationOption,
    updateCompletionTracker,
    update,
    !!mainEntityUpdate.instantTransition
  );

  if (updateCompletionTracker.isComplete()) update.isComplete = true;
}
