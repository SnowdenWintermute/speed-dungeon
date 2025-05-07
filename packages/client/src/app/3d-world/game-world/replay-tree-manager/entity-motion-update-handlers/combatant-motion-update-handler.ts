import {
  AnimationTimingType,
  SkeletalAnimationName,
  ERROR_MESSAGES,
  SpawnableEntityType,
  DynamicAnimationName,
  COMBAT_ACTIONS,
  CombatantMotionGameUpdateCommand,
} from "@speed-dungeon/common";
import { gameWorld } from "../../../SceneManager";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { plainToInstance } from "class-transformer";
import { SkeletalAnimationManager } from "../../../scene-entities/model-animation-managers/skeletal-animation-manager";
import { ManagedAnimationOptions } from "../../../scene-entities/model-animation-managers";
import { handleStepCosmeticEffects } from "../handle-step-cosmetic-effects";
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";

export function combatantMotionGameUpdateHandler(update: {
  command: CombatantMotionGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  const { mainEntityUpdate } = command;
  const { entityId, translationOption, rotationOption, animationOption } = mainEntityUpdate;

  let destinationYOption: undefined | number;

  const sceneEntityToUpdate = getSceneEntityToUpdate(mainEntityUpdate);
  const { movementManager, animationManager, cosmeticEffectManager } = sceneEntityToUpdate;

  const action = COMBAT_ACTIONS[command.actionName];

  handleStepCosmeticEffects(action, command.step, cosmeticEffectManager, entityId);

  // console.log("destinationOption: ", translationOption?.destination);

  let translationIsComplete = false;
  let animationIsComplete = false;

  if (translationOption) {
    const destination = plainToInstance(Vector3, translationOption.destination);
    // don't consider the y from the server since the server only calculates 2d positions
    if (destinationYOption) destination.y = destinationYOption;

    movementManager.startTranslating(destination, translationOption.duration, () => {
      translationIsComplete = true;

      if (
        animationIsComplete ||
        !animationOption ||
        animationOption.timing.type === AnimationTimingType.Looping
      ) {
        update.isComplete = true;
      }

      if (
        animationManager &&
        mainEntityUpdate.idleOnComplete &&
        animationManager instanceof SkeletalAnimationManager
      ) {
        const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
        if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
        combatantModelOption.startIdleAnimation(500);
      }
    });
  } else {
    translationIsComplete = true;
  }

  if (rotationOption)
    movementManager.startRotatingTowards(
      plainToInstance(Quaternion, rotationOption.rotation),
      rotationOption.duration,
      () => {}
    );

  if (animationOption && animationManager) {
    if (animationOption.timing.type === AnimationTimingType.Looping) animationIsComplete = true;

    const options: ManagedAnimationOptions = {
      shouldLoop: animationOption.timing.type === AnimationTimingType.Looping,
      animationDurationOverrideOption:
        animationOption.timing.type === AnimationTimingType.Timed
          ? animationOption.timing.duration
          : undefined,
      onComplete: function (): void {
        // otherwise looping animation will finish at an arbitrary time and could set an unintended action to complete
        if (animationOption.timing.type === AnimationTimingType.Looping) return;
        animationIsComplete = true;

        if (translationIsComplete || !translationOption) {
          update.isComplete = true;

          if (mainEntityUpdate.idleOnComplete) {
            const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
            if (!combatantModelOption)
              throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
            combatantModelOption.startIdleAnimation(500);
          }
        }
      },
    };

    if (animationManager instanceof SkeletalAnimationManager) {
      animationManager.startAnimationWithTransition(
        animationOption.name.name as SkeletalAnimationName,
        mainEntityUpdate.instantTransition ? 200 : 500,
        options
      );
    } else {
      animationManager.startAnimationWithTransition(
        animationOption.name.name as DynamicAnimationName,
        mainEntityUpdate.instantTransition ? 0 : 500,
        {
          ...options,
        }
      );
    }
  } else {
    animationIsComplete = true;
  }

  if (!translationOption && !animationOption) update.isComplete = true;
}
