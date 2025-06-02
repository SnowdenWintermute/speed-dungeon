import { ActionResolutionStepContext, ActionTracker } from "../../../action-processing/index.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionComponent } from "../index.js";

export const DAMAGING_ACTIONS_COMMON_CONFIG = {
  shouldExecute: (
    combatantContext: CombatantContext,
    previousTrackerOption: undefined | ActionTracker,
    self: CombatActionComponent
  ) => {
    const { game, party, combatant } = combatantContext;

    const targetsOption = combatant.combatantProperties.combatActionTarget;
    if (!targetsOption) return false;

    const targetingCalculator = new TargetingCalculator(
      new CombatantContext(game, party, combatant),
      null
    );

    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(self, targetsOption);
    if (targetIdsResult instanceof Error) {
      console.trace(targetIdsResult);
      return false;
    }

    if (targetIdsResult.length === 0) return false;

    // if previous was countered, don't continue the queued action sequence
    if (previousTrackerOption) {
      console.log(
        "previous tracker found for action:",
        COMBAT_ACTION_NAME_STRINGS[previousTrackerOption.actionExecutionIntent.actionName],
        "previous tracker action name:",
        COMBAT_ACTION_NAME_STRINGS[previousTrackerOption.actionExecutionIntent.actionName]
      );
      const wasCountered = iterateNumericEnumKeyedRecord(
        previousTrackerOption.hitOutcomes.outcomeFlags
      )
        .map(([key, value]) => key)
        .includes(HitOutcome.Counterattack);

      console.log(
        COMBAT_ACTION_NAME_STRINGS[previousTrackerOption.actionExecutionIntent.actionName],
        "was countered:",
        wasCountered
      );

      if (wasCountered) return false;
    }

    return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
  },
};
