import { useGameStore } from "@/stores/game-store";
import {
  ActionEntity,
  ActionEntityName,
  ActionPayableResource,
  ActivatedTriggersGameUpdateCommand,
  AdventuringParty,
  COMBATANT_CLASS_NAME_STRINGS,
  COMBATANT_CONDITION_CONSTRUCTORS,
  COMBAT_ACTIONS,
  CleanupMode,
  CombatantCondition,
  CombatantProperties,
  DurabilityChangesByEntityId,
  ERROR_MESSAGES,
  EntityId,
  Equipment,
  EquipmentSlotType,
  HitPointChanges,
  SpeedDungeonGame,
  iterateNumericEnumKeyedRecord,
  throwIfError,
} from "@speed-dungeon/common";
import { getGameWorld } from "../../SceneManager";
import { plainToInstance } from "class-transformer";
import { startOrStopCosmeticEffects } from "./start-or-stop-cosmetic-effect";
import { induceHitRecovery } from "./induce-hit-recovery";
import { postBrokenHoldableMessages } from "./post-broken-holdable-messages";
import { handleThreatChangesUpdate } from "./handle-threat-changes";
import getParty from "@/utils/getParty";

// @REFACTOR
export async function activatedTriggersGameUpdateHandler(update: {
  command: ActivatedTriggersGameUpdateCommand;
  isComplete: boolean;
}) {
  console.log("STARTED ActivatedTriggersGameUpdateCommand");
  const { command } = update;

  // keep track outside of the mutateState so we can post messages after mutating state
  // because posting messages also needs to mutate state and looks cleaner if it separately handles that
  const brokenHoldablesAndTheirOwnerIds: { ownerId: EntityId; equipment: Equipment }[] = [];

  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const partyResult = getParty(game, gameState.username);
    if (partyResult instanceof Error) throw partyResult;
    const battleOption = AdventuringParty.getBattleOption(partyResult, game);

    if (command.actionEntityChanges) {
      for (const [id, changes] of Object.entries(command.actionEntityChanges)) {
        const {
          actionLevel,
          stacks,
          userElementalAffinities,
          userKineticAffinities,
          userCombatantAttributes,
        } = changes;
        const actionEntity = throwIfError(AdventuringParty.getActionEntity(partyResult, id));
        let { actionOriginData } = actionEntity.actionEntityProperties;
        if (!actionOriginData)
          actionOriginData = actionEntity.actionEntityProperties.actionOriginData = {};
        // @PERF - probably don't need to send the whole MaxAndCurrent for level and stacks unless
        // we one day want to change the max, but it is simpler this way since we get to use a Partial of
        // the action entity's action origin properties
        // @REFACTOR create a merging factory to combine the changes with existing
        if (actionLevel !== undefined) ActionEntity.setLevel(actionEntity, actionLevel.current);
        if (stacks !== undefined) ActionEntity.setStacks(actionEntity, stacks.current);
        if (userCombatantAttributes)
          actionOriginData.userCombatantAttributes = userCombatantAttributes;
      }
    }

    if (command.supportClassLevelsGained !== undefined) {
      for (const [entityId, combatantClass] of Object.entries(command.supportClassLevelsGained)) {
        const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
        if (combatantResult instanceof Error) return combatantResult;
        const { combatantProperties } = combatantResult;
        CombatantProperties.changeSupportClassLevel(combatantProperties, combatantClass, 1);
      }
    }

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

            brokenHoldablesAndTheirOwnerIds.push({
              ownerId: combatant.entityProperties.id,
              equipment,
            });

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
          const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
          if (combatantResult instanceof Error) return combatantResult;
          for (let condition of conditions) {
            condition = plainToInstance(
              COMBATANT_CONDITION_CONSTRUCTORS[condition.name],
              condition
            );

            CombatantCondition.applyToCombatant(
              condition,
              combatantResult,
              battleOption,
              partyResult
            );

            const targetModelOption = getGameWorld().modelManager.findOne(entityId);

            startOrStopCosmeticEffects(
              condition.getCosmeticEffectWhileActive(combatantResult.entityProperties.id),
              []
            );
          }
        }
      }
    }

    if (command.removedConditionStacks) {
      for (const [entityId, conditionIdAndStacks] of Object.entries(
        command.removedConditionStacks
      )) {
        for (const { conditionId, numStacks } of conditionIdAndStacks) {
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
              conditionRemovedOption.getCosmeticEffectWhileActive(targetModelOption.entityId)
            );
          }
        }
      }
    }

    if (command.removedConditionIds) {
      for (const [entityId, conditionIdsRemoved] of Object.entries(command.removedConditionIds)) {
        for (const conditionId of conditionIdsRemoved) {
          const combatantResult = SpeedDungeonGame.getCombatantById(game, entityId);
          if (combatantResult instanceof Error) return combatantResult;

          const conditionRemovedOption = CombatantCondition.removeById(
            conditionId,
            combatantResult.combatantProperties
          );

          if (conditionRemovedOption) {
            const targetModelOption = getGameWorld().modelManager.findOne(entityId);
            startOrStopCosmeticEffects(
              [],
              conditionRemovedOption.getCosmeticEffectWhileActive(targetModelOption.entityId)
            );
          }
        }
      }
    }

    handleThreatChangesUpdate(update.command);

    console.log("command.actionEntityIdsDespawned:", command.actionEntityIdsDespawned);
    // must despawn AFTER startOrStopCosmeticEffects so we can do a little puff of smoke
    // on an entity right before we despawn it
    if (command.actionEntityIdsDespawned) {
      for (const { id, cleanupMode } of command.actionEntityIdsDespawned) {
        console.log("trying to clean up", id, "mode:", cleanupMode);
        AdventuringParty.unregisterActionEntity(partyResult, id, battleOption);
        getGameWorld().actionEntityManager.unregister(id, cleanupMode);
      }
    }

    if (command.actionEntityIdsToHide) {
      for (const id of command.actionEntityIdsToHide) {
        const actionEntity = getGameWorld().actionEntityManager.findOne(id);
        actionEntity.setVisibility(0);

        if (actionEntity.name === ActionEntityName.IceBolt)
          actionEntity.cosmeticEffectManager.softCleanup(() => {});
      }
    }
  });

  for (const { ownerId, equipment } of brokenHoldablesAndTheirOwnerIds)
    postBrokenHoldableMessages(ownerId, equipment);

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

  console.log("set update as complete");

  update.isComplete = true;
}
