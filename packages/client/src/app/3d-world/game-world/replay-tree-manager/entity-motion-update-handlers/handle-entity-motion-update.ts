import {
  ActionEntityMotionGameUpdateCommand,
  AnimationTimingType,
  AnimationType,
  COMBAT_ACTIONS,
  CombatantEquipment,
  CombatantMotionGameUpdateCommand,
  ERROR_MESSAGES,
  EntityMotionUpdate,
  EquipmentSlotType,
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
import { ItemModel } from "@/app/3d-world/scene-entities/item-models";
import getCombatantInGameById from "@speed-dungeon/common/src/game/get-combatant-in-game-by-id";
import { useGameStore } from "@/stores/game-store";

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

    if (motionUpdate.equipmentAnimations) {
      console.log("GOT equipmentAnimations:", motionUpdate.equipmentAnimations);
      const combatantModelOption =
        gameWorld.current?.modelManager.combatantModels[motionUpdate.entityId];
      if (!combatantModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
      for (const equipmentAnimation of motionUpdate.equipmentAnimations) {
        const { slot, animation } = equipmentAnimation;
        const equipment = (() => {
          const combatant = useGameStore.getState().getCombatant(motionUpdate.entityId);
          if (combatant instanceof Error) throw combatant;
          const equipment = CombatantEquipment.getEquipmentInSlot(
            combatant.combatantProperties,
            slot
          );
          if (!equipment) return undefined;
          else {
            switch (slot.type) {
              case EquipmentSlotType.Holdable:
                return combatantModelOption.equipment.holdables[equipment.entityProperties.id];
              case EquipmentSlotType.Wearable:
                return combatantModelOption.equipment.wearables[slot.slot];
            }
          }
        })();
        if (!equipment) console.log("couldn't find equipment");
        if (!(animation.name.type === AnimationType.Skeletal)) console.log("not skeletal");
        if (equipment && animation.name.type === AnimationType.Skeletal) {
          console.log("tried to start equipment animation");
          equipment.animationManager.startAnimationWithTransition(
            animation.name.name,
            animation.timing.type === AnimationTimingType.Timed ? animation.timing.duration : 0,
            {}
          );
        }
      }
    }
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
