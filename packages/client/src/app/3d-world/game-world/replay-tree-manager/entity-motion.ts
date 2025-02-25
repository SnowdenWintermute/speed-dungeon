import {
  AnimationName,
  AnimationTimingType,
  ERROR_MESSAGES,
  EntityMotionGameUpdateCommand,
  SpawnableEntityType,
} from "@speed-dungeon/common";
import { ModelMovementManager } from "../../model-movement-manager";
import {
  AnimationManager,
  ManagedAnimationOptions,
} from "../../combatant-models/animation-manager";
import { gameWorld } from "../../SceneManager";
import { Vector3 } from "@babylonjs/core";
import { plainToInstance } from "class-transformer";

export function entityMotionGameUpdateHandler(update: {
  command: EntityMotionGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;
  let movementManager: ModelMovementManager;
  let animationManager: AnimationManager | undefined;
  const { entityId, translationOption, animationOption } = command;
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
  }

  // console.log("destinationOption: ", translationOption?.destination);

  let translationIsComplete = false;
  let animationIsComplete = false;

  if (translationOption) {
    const destination = plainToInstance(Vector3, translationOption.destination);
    // don't consider the y from the server since the server only calculates 2d positions
    if (command.entityType === SpawnableEntityType.Vfx) destination.y = 0.5;

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

      if (animationManager && command.idleOnComplete)
        animationManager.startAnimationWithTransition(AnimationName.Idle, 500);
    });
  } else {
    translationIsComplete = true;
  }

  if (animationOption && animationManager) {
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
            animationManager.startAnimationWithTransition(AnimationName.Idle, 500);
        }
      },
    };
    animationManager.startAnimationWithTransition(
      animationOption.name,
      command.instantTransition ? 0 : 500,
      options
    );
  } else {
    animationIsComplete = true;
  }

  if (!translationOption && !animationOption) update.isComplete = true;
}
