import { CombatantCondition } from "../../../conditions/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { EntityId } from "../../../aliases.js";
import { ActivatedTriggersGameUpdateCommand } from "../../game-update-commands.js";
import { BattleTimelineRegistration } from "../../../battle/timeline-entries/index.js";

export function addConditionToUpdate(
  condition: CombatantCondition,
  update: ActivatedTriggersGameUpdateCommand,
  targetCombatantId: EntityId,
  triggeredBy: HitOutcome,
  timelineRegistration?: BattleTimelineRegistration
) {
  if (!update.appliedConditions) {
    update.appliedConditions = {};
  }

  let conditionsTriggeredByOutcome = update.appliedConditions[triggeredBy];

  if (!conditionsTriggeredByOutcome) {
    conditionsTriggeredByOutcome = {};
  }

  let thisCombatantConditions = conditionsTriggeredByOutcome[targetCombatantId];

  if (!thisCombatantConditions) {
    thisCombatantConditions = [];
  }
  thisCombatantConditions.push({ condition: condition.toSerialized() });

  if (timelineRegistration && !update.battleTimelineRegistrations) {
    update.battleTimelineRegistrations = [timelineRegistration];
  } else if (timelineRegistration && update.battleTimelineRegistrations) {
    update.battleTimelineRegistrations.push(timelineRegistration);
  }

  conditionsTriggeredByOutcome[targetCombatantId] = thisCombatantConditions;

  update.appliedConditions[triggeredBy] = conditionsTriggeredByOutcome;
}
