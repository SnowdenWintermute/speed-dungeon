import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant } from "../../../combatants/index.js";
import { RandomNumberGenerationPolicyFactory } from "../../../utility-classes/random-number-generation-policy.js";
import { EPSILON } from "../../../utils/index.js";
import { HitOutcomeCalculator } from "../../action-results/action-hit-outcome-calculation/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { FixedNumberGenerator } from "../../../utility-classes/randomizers.js";
import { ResourceChangePropertiesStrategy } from "../../combat-actions/action-implementations/resource-change-properties-strategy.js";

export abstract class ResourceChangeActionEvaluator {
  protected static getLowestHpCombatantOption(combatants: Combatant[]) {
    let currentBestTargetOption: Combatant | null = null;

    for (const combatant of combatants) {
      const consideringTargetHp = combatant.combatantProperties.resources.getHitPoints();
      const currentBestTargetHp =
        currentBestTargetOption?.combatantProperties.resources.getHitPoints() || Infinity;
      if (consideringTargetHp < currentBestTargetHp) {
        currentBestTargetOption = combatant;
      }
    }

    return currentBestTargetOption;
  }

  protected static getPredictedHitOutcomes(
    actionUserContext: ActionUserContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy
  ) {
    const averageHitOutcomeCalculator = new HitOutcomeCalculator(
      actionUserContext,
      actionExecutionIntent,
      RandomNumberGenerationPolicyFactory.allFixedPolicy(0.5),
      resourceChangePropertiesStrategy
    );

    const minRollRng = new FixedNumberGenerator(0);
    const maxHitOutcomeCalculator = new HitOutcomeCalculator(
      actionUserContext,
      actionExecutionIntent,
      RandomNumberGenerationPolicyFactory.allFixedPolicy(1 - EPSILON, {
        parry: minRollRng,
        shieldBlock: minRollRng,
        counterAttack: minRollRng,
        spellResist: minRollRng,
      }),
      resourceChangePropertiesStrategy
    );

    const averageHitOutcomes = averageHitOutcomeCalculator.calculateHitOutcomes();
    const maxHitOutcomes = maxHitOutcomeCalculator.calculateHitOutcomes();

    return { averageHitOutcomes, maxHitOutcomes };
  }
}
