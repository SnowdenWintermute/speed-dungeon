import {
  ActionPayableResource,
  ActivatedTriggersGameUpdateCommand,
  COMBATANT_CONDITION_CONSTRUCTORS,
  CombatantCondition,
  CombatantProperties,
  DurabilityChangesByEntityId,
  ERROR_MESSAGES,
  Equipment,
  EquipmentSlotType,
  GameUpdateCommandType,
  HitOutcomesGameUpdateCommand,
  HitPointChanges,
  Inventory,
  ResourcesPaidGameUpdateCommand,
  SpeedDungeonGame,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { gameWorld, getGameWorld } from "../../SceneManager";
import { hitOutcomesGameUpdateHandler } from "./hit-outcomes";
import { useGameStore } from "@/stores/game-store";
import { plainToInstance } from "class-transformer";
import { induceHitRecovery } from "./induce-hit-recovery";
import { entityMotionGameUpdateHandler } from "./entity-motion-update-handlers";
import { startOrStopCosmeticEffects } from "./start-or-stop-cosmetic-effect";
import { spawnEntityGameUpdateHandler } from "./spawn-entity-handler";

export const GAME_UPDATE_COMMAND_HANDLERS: Record<
  GameUpdateCommandType,
  (arg: any) => Promise<Error | void>
> = {
  [GameUpdateCommandType.CombatantMotion]: entityMotionGameUpdateHandler,
  [GameUpdateCommandType.ActionEntityMotion]: entityMotionGameUpdateHandler,
  [GameUpdateCommandType.ResourcesPaid]: async function (update: {
    command: ResourcesPaidGameUpdateCommand;
    isComplete: boolean;
  }) {
    // deduct the resources
    // enqueue the floating text messages
    const { command } = update;
    useGameStore.getState().mutateState((gameState) => {
      const game = gameState.game;
      if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      const combatantResult = SpeedDungeonGame.getCombatantById(game, command.combatantId);
      if (combatantResult instanceof Error) return combatantResult;
      const { combatantProperties } = combatantResult;

      if (command.itemsConsumed !== undefined)
        for (const itemId of command.itemsConsumed)
          Inventory.removeItem(combatantProperties.inventory, itemId);

      if (command.costsPaid) {
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
            const slot = CombatantProperties.getSlotItemIsEquippedTo(
              combatant.combatantProperties,
              equipment.entityProperties.id
            );
            // remove the model if it broke
            // @TODO - if this causes bugs because it is jumping the queue, look into it
            // if we use the queue though, it will wait to break their model and not look like it broke instantly
            // maybe we can set visibilty instead and despawn it later
            const justBrokeHoldable =
              Equipment.isBroken(equipment) && slot?.type === EquipmentSlotType.Holdable;
            if (justBrokeHoldable) {
              const characterModelOption = getGameWorld().modelManager.findOneOptional(
                combatant.entityProperties.id
              );
              console.log(
                "just broke holdable equipped to character model",
                characterModelOption?.entityId
              );
              characterModelOption?.equipmentModelManager.synchronizeCombatantEquipmentModels();
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

                startOrStopCosmeticEffects(
                  condition.getCosmeticEffectWhileActive(combatantResult.entityProperties.id),
                  []
                );
              }
            });
          }
        }
      }

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
                const targetModelOption = getGameWorld().modelManager.findOne(entityId);
                startOrStopCosmeticEffects(
                  [],
                  conditionRemovedOption
                    .getCosmeticEffectWhileActive(targetModelOption.entityId)
                    .map((cosmeticEffectOnTransformNode) => {
                      return {
                        sceneEntityIdentifier:
                          cosmeticEffectOnTransformNode.parent.sceneEntityIdentifier,
                        name: cosmeticEffectOnTransformNode.name,
                      };
                    })
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
  [GameUpdateCommandType.HitOutcomes]: hitOutcomesGameUpdateHandler,
  [GameUpdateCommandType.SpawnEntity]: spawnEntityGameUpdateHandler,
};
