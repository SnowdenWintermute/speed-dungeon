import {
  ActionEntityMotionGameUpdateCommand,
  COMBAT_ACTIONS,
  CombatantMotionGameUpdateCommand,
  EntityMotionUpdate,
} from "@speed-dungeon/common";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";
import { handleStepCosmeticEffects } from "../handle-step-cosmetic-effects";
import { handleUpdateTranslation } from "./handle-update-translation";
import { plainToInstance } from "class-transformer";
import { Quaternion } from "@babylonjs/core";
import { handleUpdateAnimation } from "./handle-update-animation";

export function handleEntityMotionUpdate(
  update: {
    command: ActionEntityMotionGameUpdateCommand | CombatantMotionGameUpdateCommand;
    isComplete: boolean;
  },
  motionUpdate: EntityMotionUpdate,
  onTranslationComplete: () => void,
  onAnimationComplete: () => void
) {
  const { command } = update;
  const { entityId, translationOption, rotationOption, animationOption } = motionUpdate;
  const action = COMBAT_ACTIONS[command.actionName];

  const toUpdate = getSceneEntityToUpdate(motionUpdate);
  const { movementManager, animationManager, cosmeticEffectManager } = toUpdate;

  const updateCompletionTracker = new EntityMotionUpdateCompletionTracker(
    animationOption,
    !!translationOption
  );

  handleStepCosmeticEffects(action, command.step, cosmeticEffectManager, entityId);
  handleUpdateTranslation(
    movementManager,
    translationOption,
    updateCompletionTracker,
    update,
    onTranslationComplete
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
    !!motionUpdate.instantTransition,
    onAnimationComplete
  );

  if (updateCompletionTracker.isComplete()) update.isComplete = true;
}
