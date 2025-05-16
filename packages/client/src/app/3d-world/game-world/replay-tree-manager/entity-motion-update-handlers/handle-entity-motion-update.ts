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
import { AbstractMesh, MeshBuilder, Quaternion, Vector3 } from "@babylonjs/core";
import { handleUpdateAnimation } from "./handle-update-animation";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";
import { getChildMeshByName } from "@/app/3d-world/utils";

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

      actionEntityModelOption.movementManager.lookingAt = null;
      actionEntityModelOption.startPointingTowardsCombatant(targetId, duration);
    }

    if (motionUpdate.setParent !== undefined) {
      if (motionUpdate.setParent === null) {
        actionEntityModelOption.rootTransformNode.setParent(null);
        console.log("set parent to null");
      }
    }

    // GRADUALLY MOVE TOWARD NEW PARENT ON HOLDABLE
    if (motionUpdate.setParentToCombatantHoldable) {
      const { combatantId, holdableId, durationToReachPosition, positionOnTarget } =
        motionUpdate.setParentToCombatantHoldable;
      const combatantModelOption = gameWorld.current?.modelManager.combatantModels[combatantId];
      if (combatantModelOption) {
        const holdableModelOption = combatantModelOption.equipment.holdables[holdableId];
        if (holdableModelOption) {
          const bone = getChildMeshByName(holdableModelOption.rootMesh, "String") as AbstractMesh;
          actionEntityModelOption.rootTransformNode.setParent(bone);
          actionEntityModelOption.movementManager.startTranslating(
            Vector3.Zero(),
            durationToReachPosition,
            () => {}
          );
        }
      }
    }

    if (motionUpdate.startPointingTowardCombatantHoldable) {
      const { combatantId, holdableId, durationToReachPosition, positionOnTarget } =
        motionUpdate.startPointingTowardCombatantHoldable;
      const combatantModelOption = gameWorld.current?.modelManager.combatantModels[combatantId];
      if (combatantModelOption) {
        const holdableModelOption = combatantModelOption.equipment.holdables[holdableId];
        if (holdableModelOption) {
          const bone = getChildMeshByName(holdableModelOption.rootMesh, "IK_Top") as AbstractMesh;

          const box = MeshBuilder.CreateBox("", { size: 0.1 });
          box.setParent(bone);
          box.setPositionWithLocalVector(Vector3.Zero());

          // const testMesh = MeshBuilder.CreateBox("", { size: 0.1 });

          console.log("set point toward holdable bone");
          actionEntityModelOption.movementManager.lookingAt = {
            // targetMesh: testMesh,
            targetMesh: box,
            alignmentSpeed: 0.2,
            isLocked: false,
          };
        }
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
