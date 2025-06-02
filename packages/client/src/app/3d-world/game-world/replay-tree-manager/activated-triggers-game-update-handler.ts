import { useGameStore } from "@/stores/game-store";
import {
  ActionPayableResource,
  ActivatedTriggersGameUpdateCommand,
  COMBATANT_CONDITION_CONSTRUCTORS,
  COMBAT_ACTIONS,
  CombatantCondition,
  CombatantProperties,
  DurabilityChangesByEntityId,
  ERROR_MESSAGES,
  Equipment,
  EquipmentSlotType,
  HitPointChanges,
  SpawnEntityGameUpdateCommand,
  SpeedDungeonGame,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { getGameWorld } from "../../SceneManager";
import { plainToInstance } from "class-transformer";
import { startOrStopCosmeticEffects } from "./start-or-stop-cosmetic-effect";
import { induceHitRecovery } from "./induce-hit-recovery";

export async function activatedTriggersGameUpdateHandler(update: {
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

            characterModelOption?.equipmentModelManager.synchronizeCombatantEquipmentModels();
          }
        }
      );
    }

    if (command.appliedConditions) {
      for (const [_hitOutcome, entityAppliedConditions] of iterateNumericEnumKeyedRecord(
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

              const targetModelOption = getGameWorld().modelManager.findOne(entityId);

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
    const action = COMBAT_ACTIONS[command.actionName];

    if (hitPointChanges) {
      for (const [entityId, hpChange] of hitPointChanges.getRecords()) {
        const combatantResult = useGameStore.getState().getCombatant(entityId);
        if (combatantResult instanceof Error) throw combatantResult;
        induceHitRecovery(
          combatantResult.entityProperties.name,
          entityId,
          command.actionName,
          command.step,
          hpChange,
          ActionPayableResource.HitPoints,
          entityId,
          false,
          action.hitOutcomeProperties.getShouldAnimateTargetHitRecovery()
        );
      }
    }
  }

  update.isComplete = true;
  // or show floating text for counterspell, "triggered tech burst" "psionic explosion"
}
