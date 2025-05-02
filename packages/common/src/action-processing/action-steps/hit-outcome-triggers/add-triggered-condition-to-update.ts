import { EntityId } from "../../../primatives";
import { ActivatedTriggersGameUpdateCommand } from "../../game-update-commands.js";

export function addRemovedConditionStacksToUpdate(
  conditionId: EntityId,
  numStacks: number,
  update: ActivatedTriggersGameUpdateCommand,
  targetCombatantId: EntityId
) {
  if (!update.removedConditionStacks) update.removedConditionStacks = {};

  let thisCombatantConditionsRemoved = update.removedConditionStacks[targetCombatantId];

  if (!thisCombatantConditionsRemoved) thisCombatantConditionsRemoved = [];
  thisCombatantConditionsRemoved.push({ conditionId, numStacks: numStacks });

  update.removedConditionStacks[targetCombatantId] = thisCombatantConditionsRemoved;
}
