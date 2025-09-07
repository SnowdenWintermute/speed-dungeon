import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionEntityMotionGameUpdateCommand,
  AnimationType,
  CombatantMotionGameUpdateCommand,
  EntityMotionUpdate,
  SpawnableEntityType,
} from "@speed-dungeon/common";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";
import { handleUpdateTranslation } from "./handle-update-translation";
import { plainToInstance } from "class-transformer";
import { Quaternion } from "@babylonjs/core";
import { handleUpdateAnimation } from "./handle-update-animation";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { DynamicAnimationManager } from "@/app/3d-world/scene-entities/model-animation-managers/dynamic-animation-manager";
import { SkeletalAnimationManager } from "@/app/3d-world/scene-entities/model-animation-managers/skeletal-animation-manager";
import { handleEntityMotionSetNewParentUpdate } from "./handle-entity-motion-set-new-parent-update";
import { handleLockRotationToFace } from "./handle-lock-rotation-to-face";
import { handleStartPointingTowardEntity } from "./handle-start-pointing-toward";
import { handleEquipmentAnimations } from "./handle-equipment-animations";

export function handleEntityMotionUpdate(
  update: {
    command: ActionEntityMotionGameUpdateCommand | CombatantMotionGameUpdateCommand;
    isComplete: boolean;
  },
  motionUpdate: EntityMotionUpdate,
  isMainUpdate: boolean
) {
  const { translationOption, rotationOption, animationOption, delayOption } = motionUpdate;

  console.log(
    "handling motion update",
    ACTION_RESOLUTION_STEP_TYPE_STRINGS[update.command.step],
    "animationOption:",
    animationOption,
    "translationOption: ",
    translationOption
  );

  const toUpdate = getSceneEntityToUpdate(motionUpdate);
  const { movementManager, skeletalAnimationManager, dynamicAnimationManager } = toUpdate;

  let onAnimationComplete = () => {};
  let onTranslationComplete = () => {};

  let cosmeticDestinationYOption = undefined;

  if (motionUpdate.entityType === SpawnableEntityType.ActionEntity) {
    cosmeticDestinationYOption = motionUpdate.cosmeticDestinationY;

    const actionEntityModelOption = getGameWorld().actionEntityManager.findOne(
      motionUpdate.entityId
    );

    if (motionUpdate.despawn) {
      actionEntityModelOption.cleanup({ softCleanup: true });
      return;
    }

    if (motionUpdate.setParent !== undefined)
      handleEntityMotionSetNewParentUpdate(actionEntityModelOption, motionUpdate.setParent);

    if (motionUpdate.lockRotationToFace !== undefined)
      handleLockRotationToFace(toUpdate, motionUpdate.lockRotationToFace);

    if (motionUpdate.startPointingToward !== undefined)
      handleStartPointingTowardEntity(toUpdate, motionUpdate.startPointingToward);

    if (isMainUpdate) {
      onTranslationComplete = () => {
        if (motionUpdate.despawnOnComplete)
          getGameWorld().actionEntityManager.unregister(motionUpdate.entityId);
      };
      onAnimationComplete = () => {};
    }
  }

  if (motionUpdate.entityType === SpawnableEntityType.Combatant) {
    const combatantModelOption = getGameWorld().modelManager.findOne(motionUpdate.entityId);

    // they are already dead, so don't animate them
    // this happens if a combatant dies from getting counterattacked and the server
    // tells them to "return home"
    if (combatantModelOption.getCombatant().combatantProperties.hitPoints <= 0) {
      update.isComplete = true;
      return;
    }

    onTranslationComplete = () => {
      if (!motionUpdate.idleOnComplete) return;
      const combatantModelOption = getGameWorld().modelManager.findOne(motionUpdate.entityId);
      console.log("idling on translation complete");
      combatantModelOption.startIdleAnimation(500);
    };

    onAnimationComplete = () => {
      if (!motionUpdate.idleOnComplete) return;
      console.log("idling on animation complete");
      const combatantModelOption = getGameWorld().modelManager.findOne(motionUpdate.entityId);
      combatantModelOption.startIdleAnimation(500);
    };

    if (motionUpdate.equipmentAnimations)
      handleEquipmentAnimations(motionUpdate.entityId, motionUpdate.equipmentAnimations);
  }

  const updateCompletionTracker = new EntityMotionUpdateCompletionTracker(
    animationOption,
    !!translationOption,
    delayOption || 0,
    update
  );

  handleUpdateTranslation(
    movementManager,
    translationOption,
    cosmeticDestinationYOption,
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

  if (animationOption) {
    let animationManager: DynamicAnimationManager | SkeletalAnimationManager =
      skeletalAnimationManager;

    if (animationOption.name.type === AnimationType.Dynamic)
      animationManager = dynamicAnimationManager;

    handleUpdateAnimation(
      animationManager,
      animationOption,
      updateCompletionTracker,
      update,
      onAnimationComplete
    );
  }

  if (isMainUpdate && updateCompletionTracker.isComplete()) {
    update.isComplete = true;
  }
}
