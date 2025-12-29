import { CombatantId, EntityId } from "../../../aliases.js";
import { ActivatedTriggersGameUpdateCommand } from "../../game-update-commands.js";

export function addRemovedConditionStacksToUpdate(
  conditionId: EntityId,
  numStacks: number,
  update: ActivatedTriggersGameUpdateCommand,
  targetCombatantId: CombatantId
) {
  if (!update.removedConditionStacks) update.removedConditionStacks = {};

  let thisCombatantConditionsRemoved = update.removedConditionStacks[targetCombatantId];

  if (!thisCombatantConditionsRemoved) thisCombatantConditionsRemoved = [];
  thisCombatantConditionsRemoved.push({ conditionId, numStacks: numStacks });

  update.removedConditionStacks[targetCombatantId] = thisCombatantConditionsRemoved;
}

export function addRemovedConditionIdToUpdate(
  conditionId: EntityId,
  update: ActivatedTriggersGameUpdateCommand,
  targetCombatantId: CombatantId
) {
  if (!update.removedConditionIds) update.removedConditionIds = {};

  let thisCombatantConditionsRemoved = update.removedConditionIds[targetCombatantId];

  if (!thisCombatantConditionsRemoved) thisCombatantConditionsRemoved = [];
  thisCombatantConditionsRemoved.push(conditionId);

  update.removedConditionIds[targetCombatantId] = thisCombatantConditionsRemoved;
}
