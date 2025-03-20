import { CombatantCondition } from "../../../combatants/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { EntityId } from "../../../primatives";
import { ActivatedTriggersGameUpdateCommand } from "../../game-update-commands.js";

export function addConditionToUpdate(
  condition: CombatantCondition,
  update: ActivatedTriggersGameUpdateCommand,
  targetCombatantId: EntityId,
  triggeredBy: HitOutcome
) {
  if (!update.appliedConditions) update.appliedConditions = {};

  let conditionsTriggeredByOutcome = update.appliedConditions[triggeredBy];

  if (!conditionsTriggeredByOutcome) conditionsTriggeredByOutcome = {};

  let thisCombatantConditions = conditionsTriggeredByOutcome[targetCombatantId];

  if (!thisCombatantConditions) thisCombatantConditions = [];
  thisCombatantConditions.push(condition);

  conditionsTriggeredByOutcome[targetCombatantId] = thisCombatantConditions;

  update.appliedConditions[triggeredBy] = conditionsTriggeredByOutcome;
}
