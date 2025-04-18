import {
  AnimationTimingType,
  SkeletalAnimationName,
  ERROR_MESSAGES,
  EntityMotionGameUpdateCommand,
  MobileVfxName,
  SpawnableEntityType,
  DynamicAnimationName,
} from "@speed-dungeon/common";
import { ModelMovementManager } from "../../model-movement-manager";
import { ManagedAnimationOptions } from "../../combatant-models/animation-manager";
import { gameWorld } from "../../SceneManager";
import { Quaternion, Vector3 } from "@babylonjs/core";
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
  const { entityId, translationOption, rotationOption, animationOption } = command;

  let destinationYOption: undefined | number;

  if (command.entityType === SpawnableEntityType.Combatant) {
    const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
    if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
    movementManager = combatantModelOption.movementManager;
    animationManager = combatantModelOption.animationManager;
  } else {
    const vfxOption = gameWorld.current?.vfxManager.mobile[entityId];
    if (!vfxOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_VFX);
    movementManager = vfxOption.movementManager;
    animationManager = vfxOption.animationManager;

    movementManager.transformNode.setParent(null);

    if (vfxOption.pointTowardEntity) {
      const combatantModelOption =
        gameWorld.current?.modelManager.combatantModels[vfxOption.pointTowardEntity];
      if (!combatantModelOption) throw new Error("Tried to point at an entity with no model");

      const targetBoundingBoxCenter =
        combatantModelOption.getBoundingInfo().boundingBox.centerWorld;
      const forward = targetBoundingBoxCenter
        .subtract(vfxOption.movementManager.transformNode.getAbsolutePosition())
        .normalize();

      const up = Vector3.Up();

      const lookRotation: Quaternion = Quaternion.FromLookDirectionLH(forward, up);
      vfxOption.movementManager.startRotatingTowards(lookRotation, 400, () => {});

      destinationYOption = targetBoundingBoxCenter.y;
    }
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

          if (command.idleOnComplete) {
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
        command.instantTransition ? 200 : 500,
        options
      );
    } else {
      animationManager.startAnimationWithTransition(
        animationOption.name.name as DynamicAnimationName,
        command.instantTransition ? 0 : 500,
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
