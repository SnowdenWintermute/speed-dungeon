import { useGameStore } from "@/stores/game-store";
import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionEntityName,
  ActivatedTriggersGameUpdateCommand,
  AdventuringParty,
  COMBAT_ACTION_NAME_STRINGS,
  ERROR_MESSAGES,
  EntityId,
  Equipment,
  throwIfError,
} from "@speed-dungeon/common";
import { getGameWorld } from "../../../SceneManager";
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
import { GameUpdateTracker } from "..";

// @REFACTOR - break into smaller functions
export async function activatedTriggersGameUpdateHandler(
  update: GameUpdateTracker<ActivatedTriggersGameUpdateCommand>
) {
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
      console.log(
        COMBAT_ACTION_NAME_STRINGS[command.actionName],
        "step",
        ACTION_RESOLUTION_STEP_TYPE_STRINGS[command.step],
        "appliedConditions:",
        Object.entries(appliedConditions).map(([combatantId, conditions]) =>
          Object.values(conditions)
        )
      );
      handleAppliedConditions(appliedConditions, party, battleOption);
    }

    if (removedConditionStacks) {
      console.log(
        COMBAT_ACTION_NAME_STRINGS[command.actionName],
        "step",
        ACTION_RESOLUTION_STEP_TYPE_STRINGS[command.step],
        "removedConditionStacks:",
        Object.keys(removedConditionStacks)
      );
      handleRemovedConditionStacks(removedConditionStacks, party);
    }

    if (removedConditionIds) {
      console.log(
        COMBAT_ACTION_NAME_STRINGS[command.actionName],
        "step",
        ACTION_RESOLUTION_STEP_TYPE_STRINGS[command.step],
        "removedConditionIds:",
        JSON.stringify(removedConditionIds)
      );
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

  update.setAsQueuedToComplete();
}
