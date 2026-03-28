import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant } from "../../../combatants/index.js";
import { FixedNumberGenerator } from "../../../utility-classes/randomizers.js";
import { HitOutcomeCalculator } from "../../action-results/action-hit-outcome-calculation/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";

export abstract class ResourceChangeActionEvaluator {
  protected static getLowestHpCombatantOption(combatants: Combatant[]) {
    let mainTargetOption: Combatant | null = null;

    for (const combatant of combatants) {
      if (
        mainTargetOption === null ||
        combatant.combatantProperties.resources.getHitPoints() <
          mainTargetOption.combatantProperties.resources.getHitPoints()
      ) {
        mainTargetOption = combatant;
      }
    }

    return mainTargetOption;
  }

  protected static getPredictedHitOutcomes(
    actionUserContext: ActionUserContext,
    actionExecutionIntent: CombatActionExecutionIntent
  ) {
    const averageHitOutcomeCalculator = new HitOutcomeCalculator(
      actionUserContext,
      actionExecutionIntent,
      new FixedNumberGenerator(0.5)
    );

    const maxHitOutcomeCalculator = new HitOutcomeCalculator(
      actionUserContext,
      actionExecutionIntent,
      new FixedNumberGenerator(0.999)
    );

    const averageHitOutcomes = averageHitOutcomeCalculator.calculateHitOutcomes();
    const maxHitOutcomes = maxHitOutcomeCalculator.calculateHitOutcomes();

    return { averageHitOutcomes, maxHitOutcomes };
  }
}
