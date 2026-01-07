import {
  ActionEntityMotionGameUpdateCommand,
  AnimationType,
  CleanupMode,
  CombatantMotionGameUpdateCommand,
  CombatantMotionUpdate,
  EntityId,
  EntityMotionUpdate,
  SpawnableEntityType,
} from "@speed-dungeon/common";
import { EntityMotionUpdateCompletionTracker } from "./entity-motion-update-completion-tracker";
import { getSceneEntityToUpdate } from "./get-scene-entity-to-update";
import { handleUpdateTranslation } from "./handle-update-translation";
import { plainToInstance } from "class-transformer";
import { Quaternion } from "@babylonjs/core";
import { handleUpdateAnimation } from "./handle-update-animation";
import { DynamicAnimationManager } from "@/game-world-view/scene-entities/model-animation-managers/dynamic-animation-manager";
import { SkeletalAnimationManager } from "@/game-world-view/scene-entities/model-animation-managers/skeletal-animation-manager";
import { handleEntityMotionSetNewParentUpdate } from "./handle-entity-motion-set-new-parent-update";
import { handleLockRotationToFace } from "./handle-lock-rotation-to-face";
import { handleStartPointingTowardEntity } from "./handle-start-pointing-toward";
import { handleEquipmentAnimations } from "./handle-equipment-animations";
import { GameUpdateTracker } from "../game-update-tracker";
import { AppStore } from "@/mobx-stores/app-store";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";

export function handleEntityMotionUpdate(
  update: GameUpdateTracker<ActionEntityMotionGameUpdateCommand | CombatantMotionGameUpdateCommand>,
  motionUpdate: EntityMotionUpdate,
  isMainUpdate: boolean
) {
  const { translationOption, rotationOption, animationOption, delayOption } = motionUpdate;

  let onAnimationComplete = () => {
    // no-op until assigned
  };
  let onTranslationComplete = () => {
    // no-op until assigned
  };

  let cosmeticDestinationYOption = undefined;

  if (motionUpdate.entityType === SpawnableEntityType.ActionEntity) {
    cosmeticDestinationYOption = motionUpdate.cosmeticDestinationY;
    const actionEntityModelOption = getGameWorldView().actionEntityManager.findOne(
      motionUpdate.entityId,
      motionUpdate
    );

    let alreadyDespawned = false;

    if (motionUpdate.setParent !== undefined) {
      handleEntityMotionSetNewParentUpdate(actionEntityModelOption, motionUpdate.setParent);
    }

    if (motionUpdate.lockRotationToFace !== undefined) {
      const toUpdate = getSceneEntityToUpdate(motionUpdate);
      handleLockRotationToFace(toUpdate, motionUpdate.lockRotationToFace);
    }

    if (motionUpdate.startPointingToward !== undefined) {
      const toUpdate = getSceneEntityToUpdate(motionUpdate);
      handleStartPointingTowardEntity(toUpdate, motionUpdate.startPointingToward);
    }

    const { despawnOnCompleteMode } = motionUpdate;

    onTranslationComplete = () => {
      if (despawnOnCompleteMode !== undefined && !alreadyDespawned) {
        despawnAndUnregisterActionEntity(motionUpdate.entityId, despawnOnCompleteMode);
        alreadyDespawned = true;
      }
    };

    onAnimationComplete = () => {
      if (despawnOnCompleteMode !== undefined && !alreadyDespawned) {
        despawnAndUnregisterActionEntity(motionUpdate.entityId, despawnOnCompleteMode);
        alreadyDespawned = true;
      }
    };

    if (!translationOption && !animationOption && despawnOnCompleteMode !== undefined) {
      despawnAndUnregisterActionEntity(motionUpdate.entityId, despawnOnCompleteMode);
    }
  }

  if (motionUpdate.entityType === SpawnableEntityType.Combatant) {
    const completionHandlers = handleCombatantMotionUpdate(motionUpdate, update);
    onAnimationComplete = completionHandlers.onAnimationComplete;
    onTranslationComplete = completionHandlers.onTranslationComplete;
  }

  const updateCompletionTracker = new EntityMotionUpdateCompletionTracker(
    animationOption,
    !!translationOption,
    delayOption || 0,
    update
  );

  if (translationOption) {
    handleUpdateTranslation(
      motionUpdate,
      translationOption,
      cosmeticDestinationYOption,
      updateCompletionTracker,
      update,
      onTranslationComplete
    );
  }

  if (rotationOption) {
    const toUpdate = getSceneEntityToUpdate(motionUpdate);
    toUpdate.movementManager.startRotatingTowards(
      plainToInstance(Quaternion, rotationOption.rotation),
      rotationOption.duration,
      () => {}
    );
  }

  if (animationOption) {
    const toUpdate = getSceneEntityToUpdate(motionUpdate);
    let animationManager: DynamicAnimationManager | SkeletalAnimationManager =
      toUpdate.skeletalAnimationManager;

    if (animationOption.name.type === AnimationType.Dynamic) {
      animationManager = toUpdate.dynamicAnimationManager;
    }

    handleUpdateAnimation(
      animationManager,
      animationOption,
      updateCompletionTracker,
      update,
      onAnimationComplete
    );
  }

  if (isMainUpdate && updateCompletionTracker.isComplete()) {
    update.setAsQueuedToComplete();
  }
}

function despawnAndUnregisterActionEntity(entityId: EntityId, cleanupMode: CleanupMode) {
  getGameWorldView().actionEntityManager.unregister(entityId, cleanupMode);

  const partyResult = AppStore.get().gameStore.getExpectedParty();
  if (partyResult instanceof Error) {
    return console.error(partyResult);
  } else {
    const { actionEntityManager } = partyResult;
    actionEntityManager.unregisterActionEntity(entityId);
  }
}

function handleCombatantMotionUpdate(
  motionUpdate: CombatantMotionUpdate,
  parentUpdate: GameUpdateTracker<
    ActionEntityMotionGameUpdateCommand | CombatantMotionGameUpdateCommand
  >
): { onTranslationComplete: () => void; onAnimationComplete: () => void } {
  const toReturn = {
    onAnimationComplete: () => {},
    onTranslationComplete: () => {},
  };

  const combatant = AppStore.get().gameStore.getExpectedCombatant(motionUpdate.entityId);

  if (motionUpdate.setParent !== undefined) {
    const combatantModelOption = getGameWorldView().modelManager.findOne(motionUpdate.entityId);
    handleEntityMotionSetNewParentUpdate(combatantModelOption, motionUpdate.setParent);
  }

  // they are already dead, so don't animate them
  // this happens if a combatant dies from getting counterattacked and the server
  // tells them to "return home"
  if (combatant.combatantProperties.isDead()) {
    parentUpdate.setAsQueuedToComplete();
    return toReturn;
  }

  toReturn.onTranslationComplete = () => {
    if (!motionUpdate.idleOnComplete) {
      return;
    }
    const combatantModelOption = getGameWorldView().modelManager.findOne(motionUpdate.entityId);
    combatantModelOption.startIdleAnimation(500);
  };

  toReturn.onAnimationComplete = () => {
    if (!motionUpdate.idleOnComplete) {
      return;
    }
    const combatantModelOption = getGameWorldView().modelManager.findOne(motionUpdate.entityId);
    combatantModelOption.startIdleAnimation(500);
  };

  if (motionUpdate.equipmentAnimations) {
    handleEquipmentAnimations(motionUpdate.entityId, motionUpdate.equipmentAnimations);
  }

  return toReturn;
}
