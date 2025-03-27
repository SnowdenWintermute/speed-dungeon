import {
  AnimationTimingType,
  SkeletalAnimationName,
  ERROR_MESSAGES,
  EntityMotionGameUpdateCommand,
  MobileVfxName,
  SpawnableEntityType,
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
} from "@speed-dungeon/common";
import { ModelMovementManager } from "../../model-movement-manager";
import { ManagedAnimationOptions } from "../../combatant-models/animation-manager";
import { gameWorld } from "../../SceneManager";
import { Vector3 } from "@babylonjs/core";
import { plainToInstance } from "class-transformer";
import { DynamicAnimationManager } from "../../combatant-models/animation-manager/dynamic-animation-manager";
import { SkeletalAnimationManager } from "../../combatant-models/animation-manager/skeletal-animation-manager";

export function entityMotionGameUpdateHandler(update: {
  command: EntityMotionGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  let movementManager: ModelMovementManager;
  let animationManager: DynamicAnimationManager | SkeletalAnimationManager | undefined;
  const { entityId, translationOption, animationOption } = command;

  let destinationYOption: undefined | number;

  // console.log("entity: ", entityId, ACTION_RESOLUTION_STEP_TYPE_STRINGS[command.step]);

  if (command.entityType === SpawnableEntityType.Combatant) {
    const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
    if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    movementManager = combatantModelOption.movementManager;
    animationManager = combatantModelOption.animationManager;
  } else {
    // console.log("ATTEMPTING TO APPLY MOTION TO VFX", translationOption?.destination);
    const vfxOption = gameWorld.current?.vfxManager.mobile[entityId];
    if (!vfxOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_VFX);
    movementManager = vfxOption.movementManager;

    movementManager.transformNode.setParent(null);

    if (vfxOption.name === MobileVfxName.Arrow) destinationYOption = 0.5;
  }

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

        if (command.despawnOnComplete) {
          if (command.entityType === SpawnableEntityType.Vfx) {
            gameWorld.current?.vfxManager.unregister(command.entityId);
          }
        }
      }

      if (
        animationManager &&
        command.idleOnComplete &&
        animationManager instanceof SkeletalAnimationManager
      )
        animationManager.startAnimationWithTransition(SkeletalAnimationName.Idle, 500);
    });
  } else {
    translationIsComplete = true;
  }

  if (animationOption && animationManager) {
    if (!(animationManager instanceof SkeletalAnimationManager)) return;
    if (animationOption.timing.type === AnimationTimingType.Looping) animationIsComplete = true;

    const options: ManagedAnimationOptions = {
      shouldLoop: animationOption.timing.type === AnimationTimingType.Looping,
      animationEventOption: null,
      animationDurationOverrideOption:
        animationOption.timing.type === AnimationTimingType.Timed
          ? animationOption.timing.duration
          : null,
      onComplete: function (): void {
        // otherwise looping animation will finish at an arbitrary time and could set an unintended action to complete
        if (animationOption.timing.type === AnimationTimingType.Looping) return;
        animationIsComplete = true;

        if (translationIsComplete || !translationOption) {
          update.isComplete = true;

          if (command.idleOnComplete)
            animationManager.startAnimationWithTransition(SkeletalAnimationName.Idle, 500);
        }
      },
    };
    animationManager.startAnimationWithTransition(
      animationOption.name.name as SkeletalAnimationName,
      command.instantTransition ? 0 : 500,
      options
    );
  } else {
    animationIsComplete = true;
  }

  if (!translationOption && !animationOption) update.isComplete = true;
}
