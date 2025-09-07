import {
  ActionEntityMotionGameUpdateCommand,
  AnimationType,
  CombatantMotionGameUpdateCommand,
  CombatantProperties,
  CombatantTurnTracker,
  ERROR_MESSAGES,
  EntityMotionUpdate,
  InputLock,
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
import getCurrentParty from "@/utils/getCurrentParty";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { handleThreatChangesUpdate } from "../handle-threat-changes";
import { useGameStore } from "@/stores/game-store";

export function handleEntityMotionUpdate(
  update: {
    command: ActionEntityMotionGameUpdateCommand | CombatantMotionGameUpdateCommand;
    isComplete: boolean;
  },
  motionUpdate: EntityMotionUpdate,
  isMainUpdate: boolean
) {
  const { translationOption, rotationOption, animationOption, delayOption } = motionUpdate;

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

  // UNLOCKING INPUTS AND TURN END

  const { actionCompletionProperties } = update.command.mainEntityUpdate;
  if (actionCompletionProperties) {
    if (actionCompletionProperties.endActiveCombatantTurn) {
      useGameStore.getState().mutateState((state) => {
        const battleId = state.getCurrentBattleId();
        if (!battleId) return console.error("no battle but tried to end turn");
        const battleOption = state.game?.battles[battleId];
        if (!state.game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
        if (!battleOption) return console.error("no battle but tried to end turn");
        const partyOption = getCurrentParty(state, state.username || "");
        if (!partyOption) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);

        const actionNameOption = update.command.actionName;

        battleOption.turnOrderManager.updateSchedulerWithExecutedActionDelay(
          partyOption,
          actionNameOption
        );

        // REFILL THE QUICK ACTIONS OF THE CURRENT TURN
        // this way, if we want to remove their quick actions they can be at risk
        // of actions taking them away before they get their turn again
        const fastestTracker = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
        if (fastestTracker instanceof CombatantTurnTracker) {
          const { combatantProperties } = fastestTracker.getCombatant(partyOption);
          CombatantProperties.refillActionPoints(combatantProperties);
          CombatantProperties.tickCooldowns(combatantProperties);
        }

        battleOption.turnOrderManager.updateTrackers(state.game, partyOption);
        const newlyActiveTracker = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
        characterAutoFocusManager.updateFocusedCharacterOnNewTurnOrder(state, newlyActiveTracker);
      });
    }

    if (actionCompletionProperties.unlockInput) {
      useGameStore.getState().mutateState((state) => {
        const partyOption = getCurrentParty(state, state.username || "");
        if (partyOption) InputLock.unlockInput(partyOption.inputLock);
      });
    }

    handleThreatChangesUpdate(actionCompletionProperties.threatChanges);
  }

  if (isMainUpdate && updateCompletionTracker.isComplete()) {
    update.isComplete = true;
  }
}
