import {
  ActionPayableResource,
  ActivatedTriggersGameUpdateCommand,
  COMBATANT_CONDITION_CONSTRUCTORS,
  CombatantCondition,
  CombatantProperties,
  DurabilityChangesByEntityId,
  ERROR_MESSAGES,
  EntityMotionGameUpdateCommand,
  Equipment,
  GameUpdateCommandType,
  HitOutcomesGameUpdateCommand,
  HitPointChanges,
  Inventory,
  ResourcesPaidGameUpdateCommand,
  SpawnEntityGameUpdateCommand,
  SpawnableEntityType,
  SpeedDungeonGame,
  AbstractParentType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";
import { ActionEntityModel, spawnActionEntityModel } from "../../vfx-models";
import { getChildMeshByName } from "../../utils";
import {
  SKELETON_MAIN_HAND_NAMES,
  SKELETON_OFF_HAND_NAMES,
  SKELETON_STRUCTURE_TYPE,
} from "../../combatant-models/modular-character/skeleton-structure-variables";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { entityMotionGameUpdateHandler } from "./entity-motion";
import { hitOutcomesGameUpdateHandler } from "./hit-outcomes";
import { useGameStore } from "@/stores/game-store";
import { plainToInstance } from "class-transformer";
import { induceHitRecovery } from "../../combatant-models/animation-manager/induce-hit-recovery";
import { startOrStopCosmeticEffect } from "./start-or-stop-cosmetic-effect";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Promise<Error | void>
> = {
  [GameUpdateCommandType.EntityMotion]: async function (update: {
    command: EntityMotionGameUpdateCommand;
    isComplete: boolean;
  }) {
    entityMotionGameUpdateHandler(update);
  },
  [GameUpdateCommandType.ResourcesPaid]: async function (update: {
    command: ResourcesPaidGameUpdateCommand;
    isComplete: boolean;
  }) {
    // deduct the resources
    // enqueue the floating text messages
    const { command } = update;
    console.log("command:", command);
    useGameStore.getState().mutateState((gameState) => {
      const game = gameState.game;
      if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      const combatantResult = SpeedDungeonGame.getCombatantById(game, command.combatantId);
      if (combatantResult instanceof Error) return combatantResult;
      const { combatantProperties } = combatantResult;

      if (command.itemsConsumed !== undefined) {
        for (const itemId of command.itemsConsumed) {
          const removedItem = Inventory.removeItem(combatantProperties.inventory, itemId);
        }
      }

      if (command.costsPaid) {
        console.log("costs paid: ", command.costsPaid);
        for (const [resource, cost] of iterateNumericEnumKeyedRecord(command.costsPaid)) {
          switch (resource) {
            case ActionPayableResource.HitPoints:
              CombatantProperties.changeHitPoints(combatantProperties, cost);
              break;
            case ActionPayableResource.Mana:
              CombatantProperties.changeMana(combatantProperties, cost);
              break;
            case ActionPayableResource.Shards:
            case ActionPayableResource.QuickActions:
          }
        }
      }
    });

    update.isComplete = true;
  },
  [GameUpdateCommandType.ActivatedTriggers]: async function (update: {
    command: ActivatedTriggersGameUpdateCommand;
    isComplete: boolean;
  }) {
    const { command } = update;
    useGameStore.getState().mutateState((gameState) => {
      const game = gameState.game;
      if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      if (command.durabilityChanges) {
        gameState.rerenderForcer += 1; // for some reason it delays updating the durability indicators on bow use without this
        // playBeep();
        DurabilityChangesByEntityId.ApplyToGame(
          game,
          command.durabilityChanges,
          (combatant, equipment) => {
            // remove the model if it broke
            // @TODO - if this causes bugs because it is jumping the queue, look into it
            // if we use the queue though, it doesn't remove their item model imediately
            if (Equipment.isBroken(equipment)) {
              gameWorld.current?.modelManager.combatantModels[
                combatant.entityProperties.id
              ]?.unequipHoldableModel(equipment.entityProperties.id);
            }
          }
        );
      }

      if (command.appliedConditions) {
        for (const [hitOutcome, entityAppliedConditions] of iterateNumericEnumKeyedRecord(
          command.appliedConditions
        )) {
          for (const [entityId, conditions] of Object.entries(entityAppliedConditions)) {
            useGameStore.getState().mutateState((state) => {
              const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
              if (combatantResult instanceof Error) return combatantResult;
              for (let condition of conditions) {
                condition = plainToInstance(
                  COMBATANT_CONDITION_CONSTRUCTORS[condition.name],
                  condition
                );

                CombatantCondition.applyToCombatant(condition, combatantResult.combatantProperties);

                const targetModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
                if (!targetModelOption)
                  throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

                startOrStopCosmeticEffect(
                  condition.getCosmeticEffectWhileActive(),
                  [],
                  targetModelOption.cosmeticEffectManager,
                  targetModelOption.entityId
                );
              }
            });
          }
        }
      }

      console.log("command.removedConditionStacks", command.removedConditionStacks);
      if (command.removedConditionStacks) {
        for (const [entityId, conditionIdAndStacks] of Object.entries(
          command.removedConditionStacks
        )) {
          for (const { conditionId, numStacks } of conditionIdAndStacks) {
            useGameStore.getState().mutateState((state) => {
              const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
              if (combatantResult instanceof Error) return combatantResult;

              const conditionRemovedOption = CombatantCondition.removeStacks(
                conditionId,
                combatantResult.combatantProperties,
                numStacks
              );

              if (conditionRemovedOption) {
                const targetModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
                if (!targetModelOption)
                  throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
                startOrStopCosmeticEffect(
                  [],
                  conditionRemovedOption
                    .getCosmeticEffectWhileActive()
                    .map((clienOnlyVfx) => clienOnlyVfx.name),
                  targetModelOption.cosmeticEffectManager,
                  targetModelOption.entityId
                );
              }
            });
          }
        }
      }
    });

    if (command.hitPointChanges) {
      const hitPointChanges = plainToInstance(HitPointChanges, command.hitPointChanges);

      if (!gameWorld.current) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
      if (hitPointChanges) {
        for (const [entityId, hpChange] of hitPointChanges.getRecords()) {
          const combatantResult = useGameStore.getState().getCombatant(entityId);
          if (combatantResult instanceof Error) throw combatantResult;
          induceHitRecovery(
            gameWorld.current,
            combatantResult.entityProperties.name,
            entityId,
            command.actionName,
            command.step,
            hpChange,
            ActionPayableResource.HitPoints,
            entityId,
            false,
            true
          );
        }
      }
    }

    update.isComplete = true;
    // or show floating text for counterspell, "triggered tech burst" "psionic explosion"
  },
  [GameUpdateCommandType.HitOutcomes]: async function (update: {
    command: HitOutcomesGameUpdateCommand;
    isComplete: boolean;
  }) {
    update.isComplete = true;
    hitOutcomesGameUpdateHandler(update);
  },
  [GameUpdateCommandType.SpawnEntity]: async function (update: {
    command: SpawnEntityGameUpdateCommand;
    isComplete: boolean;
  }) {
    const { command } = update;
    if (command.entity.type !== SpawnableEntityType.ActionEntity) {
      update.isComplete = true;
      return;
    }
    if (!gameWorld.current) return new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);

    const { actionEntity } = command.entity;
    const { actionEntityProperties } = actionEntity;

    const position = new Vector3(
      actionEntityProperties.position._x,
      actionEntityProperties.position._y,
      actionEntityProperties.position._z
    );

    const scene = await spawnActionEntityModel(actionEntityProperties.name, position);

    const vfxModel = new ActionEntityModel(
      actionEntity.entityProperties.id,
      scene,
      position,
      actionEntityProperties.name,
      actionEntityProperties.pointTowardEntityOption
    );

    update.isComplete = true;

    gameWorld.current.vfxManager.register(vfxModel);

    if (actionEntityProperties.parentOption) {
      const actionUserOption =
        gameWorld.current.modelManager.combatantModels[
          actionEntityProperties.parentOption.parentEntityId
        ];
      if (!actionUserOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

      // @TODO - refactor
      const boneNameList = (() => {
        switch (actionEntityProperties.parentOption.type) {
          case AbstractParentType.UserMainHand:
            return SKELETON_MAIN_HAND_NAMES;
          case AbstractParentType.UserOffHand:
            return SKELETON_OFF_HAND_NAMES;
          case AbstractParentType.VfxEntityRoot:
          case AbstractParentType.CombatantHitboxCenter:
            return "root";
        }
      })();

      const boneToParent = getChildMeshByName(
        actionUserOption.rootMesh,
        boneNameList[SKELETON_STRUCTURE_TYPE]
      );

      if (!boneToParent) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_EXPECTED_BONE);
      vfxModel.movementManager.transformNode.setParent(boneToParent);
      vfxModel.movementManager.transformNode.setPositionWithLocalVector(Vector3.Zero());
      vfxModel.movementManager.transformNode.rotationQuaternion = Quaternion.Identity();
    }
  },
};
