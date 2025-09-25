import { useGameStore } from "@/stores/game-store";
import {
  ActionEntityName,
  ActionPayableResource,
  ActivatedTriggersGameUpdateCommand,
  AdventuringParty,
  COMBAT_ACTIONS,
  ERROR_MESSAGES,
  EntityId,
  Equipment,
  HitPointChanges,
  throwIfError,
} from "@speed-dungeon/common";
import { getGameWorld } from "../../../SceneManager";
import { plainToInstance } from "class-transformer";
import { induceHitRecovery } from "../induce-hit-recovery";
import { postBrokenHoldableMessages } from "../post-broken-holdable-messages";
import { handleThreatChangesUpdate } from "../handle-threat-changes";
import getParty from "@/utils/getParty";
import { handleActionEntityChanges } from "./handle-action-entity-changes";
import { handleSupportClassLevelsChanged } from "./handle-support-class-levels-changed";
import { handleDurabilityChanges } from "./handle-durability-changes";
import { handleAppliedConditions } from "./handle-applied-conditions";
import { handleRemovedConditionStacks } from "./handle-removed-condition-stacks";
import { handleRemovedConditionIds } from "./handle-removed-condition-ids";
import { handleHitPointChanges } from "./handle-hit-point-changes";

// @REFACTOR - break into smaller functions
export async function activatedTriggersGameUpdateHandler(update: {
  command: ActivatedTriggersGameUpdateCommand;
  isComplete: boolean;
}) {
  const { command } = update;

  // keep track outside of the mutateState so we can post messages after mutating state
  // because posting messages also needs to mutate state and looks cleaner if it separately handles that
  const brokenHoldablesAndTheirOwnerIds: { ownerId: EntityId; equipment: Equipment }[] = [];

  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const party = throwIfError(getParty(game, gameState.username));
    const battleOption = AdventuringParty.getBattleOption(party, game);

    const {
      actionEntityChanges,
      supportClassLevelsGained,
      durabilityChanges,
      appliedConditions,
      removedConditionStacks,
      removedConditionIds,
    } = command;

    if (actionEntityChanges) {
      handleActionEntityChanges(actionEntityChanges, party);
    }

    if (supportClassLevelsGained !== undefined) {
      handleSupportClassLevelsChanged(supportClassLevelsGained, party);
    }

    if (durabilityChanges) {
      handleDurabilityChanges(durabilityChanges, party, gameState, brokenHoldablesAndTheirOwnerIds);
    }

    if (appliedConditions) {
      handleAppliedConditions(appliedConditions, party, battleOption);
    }

    if (removedConditionStacks) {
      handleRemovedConditionStacks(removedConditionStacks, party);
    }

    if (removedConditionIds) {
      handleRemovedConditionIds(removedConditionIds, party);
    }

    handleThreatChangesUpdate(update.command);

    // must despawn AFTER startOrStopCosmeticEffects so we can do a little puff of smoke
    // on an entity right before we despawn it
    if (command.actionEntityIdsDespawned) {
      for (const { id, cleanupMode } of command.actionEntityIdsDespawned) {
        AdventuringParty.unregisterActionEntity(party, id, battleOption);
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

  handleHitPointChanges(command);

  update.isComplete = true;
}
