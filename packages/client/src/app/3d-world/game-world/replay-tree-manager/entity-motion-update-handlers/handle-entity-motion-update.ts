import {
  ActionEntityMotionGameUpdateCommand,
  COMBAT_ACTIONS,
  CombatantMotionGameUpdateCommand,
  ERROR_MESSAGES,
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
import { gameWorld } from "@/app/3d-world/SceneManager";

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
  const { movementManager, animationManager, cosmeticEffectManager } = toUpdate;

  let onAnimationComplete = () => {};
  let onTranslationComplete = () => {};

  let cosmeticDestinationYOption = undefined;

  if (motionUpdate.entityType === SpawnableEntityType.ActionEntity) {
    cosmeticDestinationYOption = motionUpdate.cosmeticDestinationY;

    const actionEntityModelOption =
      gameWorld.current?.actionEntityManager.models[motionUpdate.entityId];
    if (!actionEntityModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_ACTION_ENTITY_MODEL);

    if (motionUpdate.startPointingTowardEntityOption) {
      const { targetId, duration } = motionUpdate.startPointingTowardEntityOption;

      actionEntityModelOption.startPointingTowardsCombatant(targetId, duration);
    }

    if (motionUpdate.setParent !== undefined) {
      if (motionUpdate.setParent === null) {
        actionEntityModelOption.rootTransformNode.setParent(null);
        console.log("set parent to null");
      }
    }

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
      if (motionUpdate.idleOnComplete) {
        const combatantModelOption =
          gameWorld.current?.modelManager.combatantModels[motionUpdate.entityId];
        if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
        combatantModelOption.startIdleAnimation(500);
      }
    };

    onAnimationComplete = () => {
      if (motionUpdate.idleOnComplete) {
        const combatantModelOption =
          gameWorld.current?.modelManager.combatantModels[motionUpdate.entityId];
        if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
        combatantModelOption.startIdleAnimation(500);
      }
    };
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

  handleUpdateAnimation(
    animationManager,
    animationOption,
    updateCompletionTracker,
    update,
    !!motionUpdate.instantTransition,
    onAnimationComplete
  );

  if (isMainUpdate && updateCompletionTracker.isComplete()) update.isComplete = true;
}
