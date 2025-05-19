import {
  ActionEntityMotionGameUpdateCommand,
  AnimationType,
  COMBAT_ACTIONS,
  CombatantMotionGameUpdateCommand,
  EntityMotionUpdate,
  SpawnableEntityType,
} from "@speed-dungeon/common";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";
import { handleStepCosmeticEffects } from "../handle-step-cosmetic-effects";
import { handleUpdateTranslation } from "./handle-update-translation";
import { plainToInstance } from "class-transformer";
import { Quaternion } from "@babylonjs/core";
import { handleUpdateAnimation } from "./handle-update-animation";
import { gameWorld, getGameWorld } from "@/app/3d-world/SceneManager";
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
  const { command } = update;
  const { entityId, translationOption, rotationOption, animationOption } = motionUpdate;
  const action = COMBAT_ACTIONS[command.actionName];

  const toUpdate = getSceneEntityToUpdate(motionUpdate);
  const {
    movementManager,
    skeletalAnimationManager,
    dynamicAnimationManager,
    cosmeticEffectManager,
  } = toUpdate;

  let onAnimationComplete = () => {};
  let onTranslationComplete = () => {};

  let cosmeticDestinationYOption = undefined;

  if (motionUpdate.entityType === SpawnableEntityType.ActionEntity) {
    cosmeticDestinationYOption = motionUpdate.cosmeticDestinationY;

    const actionEntityModelOption = getGameWorld().actionEntityManager.findOne(
      motionUpdate.entityId
    );

    if (motionUpdate.setParent !== undefined)
      handleEntityMotionSetNewParentUpdate(actionEntityModelOption, motionUpdate.setParent);

    if (motionUpdate.lockRotationToFace !== undefined)
      handleLockRotationToFace(toUpdate, motionUpdate.lockRotationToFace);

    if (motionUpdate.startPointingToward !== undefined)
      handleStartPointingTowardEntity(toUpdate, motionUpdate.startPointingToward);

    if (isMainUpdate) {
      onTranslationComplete = () => {
        if (motionUpdate.despawnOnComplete)
          gameWorld.current?.actionEntityManager.unregister(motionUpdate.entityId);
      };
      onAnimationComplete = () => {};
    }
  }

  if (motionUpdate.entityType === SpawnableEntityType.Combatant) {
    onTranslationComplete = () => {
      if (!motionUpdate.idleOnComplete) return;
      const combatantModelOption = getGameWorld().modelManager.findOne(motionUpdate.entityId);
      combatantModelOption.startIdleAnimation(500);
    };

    onAnimationComplete = () => {
      if (!motionUpdate.idleOnComplete) return;
      const combatantModelOption = getGameWorld().modelManager.findOne(motionUpdate.entityId);
      combatantModelOption.startIdleAnimation(500);
    };

    if (motionUpdate.equipmentAnimations)
      handleEquipmentAnimations(motionUpdate.entityId, motionUpdate.equipmentAnimations);
  }

  const updateCompletionTracker = new EntityMotionUpdateCompletionTracker(
    animationOption,
    !!translationOption
  );

  handleStepCosmeticEffects(action, command.step, cosmeticEffectManager, entityId);

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
      !!motionUpdate.instantTransition,
      onAnimationComplete
    );
  }

  if (isMainUpdate && updateCompletionTracker.isComplete()) update.isComplete = true;
}
