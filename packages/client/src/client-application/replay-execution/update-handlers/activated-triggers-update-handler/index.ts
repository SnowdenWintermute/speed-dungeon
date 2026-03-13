import {
  ActionEntityName,
  ActivatedTriggersGameUpdateCommand,
  AdventuringParty,
  CombatantClass,
  EntityId,
  Equipment,
} from "@speed-dungeon/common";
import { handleActionEntityChanges } from "./handle-action-entity-changes";
import { handleSupportClassLevelsChanged } from "./handle-support-class-levels-changed";
import { handleDurabilityChanges } from "./handle-durability-changes";
import { handleAppliedConditions } from "./handle-applied-conditions";
import { handleRemovedConditionStacks } from "./handle-removed-condition-stacks";
import { handleRemovedConditionIds } from "./handle-removed-condition-ids";
import { handleHitPointChanges } from "./handle-hit-point-changes";
import { GameUpdateTracker } from "../game-update-tracker";
import { handlePetSlotsSummoned } from "./handle-pets-summoned";
import { handlePetSlotsUnsummoned } from "./handle-pets-unsummoned";
import { handlePetsTamed } from "./handle-pets-tamed";
import { handlePetSlotsReleased } from "./handle-pets-released";
import { FloatingMessageService } from "@/mobx-stores/game-event-notifications/floating-message-service";
import { AppStore } from "@/mobx-stores/app-store";
import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { handleThreatChangesUpdate } from "./threat-changes";
import { ClientApplication } from "@/client-application";

export async function activatedTriggersGameUpdateHandler(
  clientApplication: ClientApplication,
  update: GameUpdateTracker<ActivatedTriggersGameUpdateCommand>
) {
  const { command } = update;

  // keep track outside of the mutateState so we can post messages after mutating state
  // because posting messages also needs to mutate state and looks cleaner if it separately handles that
  const brokenHoldablesAndTheirOwnerIds: { ownerId: EntityId; equipment: Equipment }[] = [];

  const { game, party } = AppStore.get().gameStore.getFocusedCharacterContext();
  const battleOption = party.getBattleOption(game);

  const {
    actionEntityChanges,
    supportClassLevelsGained,
    durabilityChanges,
    appliedConditions,
    removedConditionStacks,
    removedConditionIds,
    petSlotsSummoned,
    petSlotsReleased,
    petsUnsummoned,
    petsTamed,
  } = command;

  if (actionEntityChanges) {
    handleActionEntityChanges(actionEntityChanges, party);
  }

  if (petSlotsSummoned) {
    handlePetSlotsSummoned(petSlotsSummoned, party, game);
  }

  if (petSlotsReleased) {
    handlePetSlotsReleased(petSlotsReleased, party);
  }

  if (petsUnsummoned) {
    handlePetSlotsUnsummoned(petsUnsummoned, party, game);
  }

  if (petsTamed) {
    handlePetsTamed(petsTamed, party, game);
  }

  if (supportClassLevelsGained !== undefined) {
    handleSupportClassLevelsChanged(supportClassLevelsGained, party);
  }

  if (durabilityChanges) {
    handleDurabilityChanges(durabilityChanges, party, brokenHoldablesAndTheirOwnerIds);
  }

  if (removedConditionStacks) {
    handleRemovedConditionStacks(removedConditionStacks, party);
  }

  if (removedConditionIds) {
    handleRemovedConditionIds(removedConditionIds, party);
  }

  if (appliedConditions) {
    handleAppliedConditions(appliedConditions, party, battleOption);
  }

  handleThreatChangesUpdate(clientApplication, update.command);

  // must despawn AFTER startOrStopCosmeticEffects so we can do a little puff of smoke
  // on an entity right before we despawn it
  const { actionEntityManager } = party;
  if (command.actionEntityIdsDespawned) {
    for (const { id, cleanupMode } of command.actionEntityIdsDespawned) {
      actionEntityManager.unregisterActionEntity(id);
      getGameWorldView().actionEntityManager.unregister(id, cleanupMode);
    }
  }

  if (command.actionEntityIdsToHide) {
    for (const id of command.actionEntityIdsToHide) {
      const actionEntity = getGameWorldView().actionEntityManager.findOne(id);
      actionEntity.setVisibility(0);

      // @REFACTOR - this looks like duct tape
      if (actionEntity.name === ActionEntityName.IceBolt) {
        actionEntity.cosmeticEffectManager.softCleanup(() => {
          //
        });
      }
    }
  }

  for (const { ownerId, equipment } of brokenHoldablesAndTheirOwnerIds) {
    FloatingMessageService.startBrokenHoldablesMessage(ownerId, equipment);
  }

  handleHitPointChanges(command);

  update.setAsQueuedToComplete();
}

class ActionEffectsApplyerCommand {
  party: AdventuringParty;
  constructor(
    private clientApplication: ClientApplication,
    private update: ActivatedTriggersGameUpdateCommand
  ) {
    const context = clientApplication.combatantFocus.requireFocusedCharacterContext();
    this.party = context.party;
  }
  execute() {
    this.applySupportClassLevelsGained(this.update.supportClassLevelsGained);
    this.applyConditionStacksRemoved(this.update.removedConditionStacks);
    this.applyConditionsRemoved(this.update.removedConditionIds);
  }

  private applySupportClassLevelsGained(
    supportClassLevelsGained: Record<string, CombatantClass> | undefined
  ) {
    if (!supportClassLevelsGained) return;

    for (const [entityId, combatantClass] of Object.entries(supportClassLevelsGained)) {
      const combatantResult = this.party.combatantManager.getExpectedCombatant(entityId);
      const { combatantProperties } = combatantResult;
      combatantProperties.classProgressionProperties.incrementSupportClassLevel(combatantClass);
    }
  }

  private applyConditionStacksRemoved(
    removedConditionStacks:
      | undefined
      | Record<
          string,
          {
            conditionId: EntityId;
            numStacks: number;
          }[]
        >
  ) {
    if (!removedConditionStacks) return;

    const { gameWorldView } = this.clientApplication;

    for (const [entityId, conditionIdAndStacks] of Object.entries(removedConditionStacks)) {
      for (const { conditionId, numStacks } of conditionIdAndStacks) {
        const combatantResult = this.party.combatantManager.getExpectedCombatant(entityId);

        const { conditionManager } = combatantResult.combatantProperties;
        const conditionRemovedOption = conditionManager.removeStacks(conditionId, numStacks);

        if (!gameWorldView) {
          continue;
        }

        if (conditionRemovedOption) {
          const targetModelOption = gameWorldView.modelManager.findOne(entityId);

          gameWorldView.startOrStopCosmeticEffects(
            [],
            conditionRemovedOption.getCosmeticEffectWhileActive?.(targetModelOption.entityId)
          );
        }
      }
    }
  }

  private applyConditionsRemoved(removedConditionIds: undefined | Record<string, string[]>) {
    if (!removedConditionIds) return;

    const { gameWorldView } = this.clientApplication;
    for (const [entityId, conditionIdsRemoved] of Object.entries(removedConditionIds)) {
      for (const conditionId of conditionIdsRemoved) {
        const combatantResult = this.party.combatantManager.getExpectedCombatant(entityId);

        const { conditionManager } = combatantResult.combatantProperties;
        const conditionRemovedOption = conditionManager.removeConditionById(conditionId);

        if (!gameWorldView) {
          continue;
        }

        if (conditionRemovedOption) {
          const targetModelOption = gameWorldView.modelManager.findOne(entityId);
          gameWorldView.startOrStopCosmeticEffects(
            [],
            conditionRemovedOption.getCosmeticEffectWhileActive?.(targetModelOption.entityId)
          );
        }
      }
    }
  }
}
