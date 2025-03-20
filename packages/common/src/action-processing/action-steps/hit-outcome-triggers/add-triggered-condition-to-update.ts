import { EntityId } from "../../../primatives";
import { ActivatedTriggersGameUpdateCommand } from "../../game-update-commands.js";

export function addRemovedConditionToUpdate(
  conditionId: EntityId,
  update: ActivatedTriggersGameUpdateCommand,
  targetCombatantId: EntityId
) {
  if (!update.removedConditionIds) update.removedConditionIds = {};

  let thisCombatantConditionsRemoved = update.removedConditionIds[targetCombatantId];

  if (!thisCombatantConditionsRemoved) thisCombatantConditionsRemoved = [];
  thisCombatantConditionsRemoved.push(conditionId);

  update.removedConditionIds[targetCombatantId] = thisCombatantConditionsRemoved;
}
