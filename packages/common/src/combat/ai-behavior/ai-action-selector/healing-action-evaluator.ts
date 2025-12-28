import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant, CombatAttribute } from "../../../combatants/index.js";
import { NormalizedPercentage } from "../../../aliases.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { PotentialTotalResourceChangeEvaluation } from "./potential-total-resource-change-evaluation.js";
import { ResourceChangeActionEvaluator } from "./resource-change-action-evaluator.js";

export const NEEDS_HEALING_HP_NORMALIZED_PERCENTAGE: NormalizedPercentage = 0.7;

export class HealingActionEvaluator extends ResourceChangeActionEvaluator {
  static evaluateActionIntents(
    intents: CombatActionExecutionIntent[],
    actionUserContext: ActionUserContext,
    consideredCombatants: Combatant[]
  ) {
    const mainTarget =
      ResourceChangeActionEvaluator.getLowestHpCombatantOption(consideredCombatants);
    if (mainTarget === null) {
      return null;
    }

    const evaluatedIntents: {
      intent: CombatActionExecutionIntent;
      evaluation: PotentialTotalResourceChangeEvaluation;
    }[] = [];

    const { actionUser } = actionUserContext;

    for (const actionExecutionIntent of intents) {
      const { actionName, rank } = actionExecutionIntent;
      const action = COMBAT_ACTIONS[actionName];

      const { averageHitOutcomes, maxHitOutcomes } =
        ResourceChangeActionEvaluator.getPredictedHitOutcomes(
          actionUserContext,
          actionExecutionIntent
        );

      const averageHitPointChanges =
        averageHitOutcomes.resourceChanges?.[CombatActionResource.HitPoints];

      const maxHitPointChanges = maxHitOutcomes.resourceChanges?.[CombatActionResource.HitPoints];

      if (!averageHitPointChanges || !maxHitPointChanges) {
        continue;
      }

      const resourceCosts = action.costProperties.getResourceCosts(actionUser, true, rank);
      const resourceCost = resourceCosts?.[CombatActionResource.Mana] ?? 0;
      const potentialHealingEvaluation = new PotentialTotalResourceChangeEvaluation(resourceCost);

      for (const combatant of consideredCombatants) {
        const targetId = combatant.entityProperties.id;
        const { attributeProperties, resources } = combatant.combatantProperties;
        const hitPoints = resources.getHitPoints();
        const maxHitPoints = attributeProperties.getAttributeValue(CombatAttribute.Hp);
        const missingHitPoints = Math.max(0, maxHitPoints - hitPoints);

        const averageValueChange = averageHitPointChanges.getRecord(targetId)?.value || 0;
        const averageEffectiveValueChange = Math.min(missingHitPoints, averageValueChange);
        const maxValueChange = maxHitPointChanges.getRecord(targetId)?.value || 0;
        const maxEffectiveValueChange = Math.min(missingHitPoints, maxValueChange);

        if (maxEffectiveValueChange === 0) {
          continue;
        }

        if (targetId === mainTarget.entityProperties.id) {
          potentialHealingEvaluation.setPrimaryTargetEfficiencyEvaluation(
            maxEffectiveValueChange,
            averageEffectiveValueChange
          );
        }

        potentialHealingEvaluation.setOrUpdateTotalAcrossAllTargets(
          maxEffectiveValueChange,
          averageEffectiveValueChange
        );
      }

      potentialHealingEvaluation.computeEfficiencyAcrossAllTargets();

      const evaluatedIntent = {
        intent: actionExecutionIntent,
        evaluation: potentialHealingEvaluation,
      };

      evaluatedIntents.push(evaluatedIntent);
    }

    evaluatedIntents.sort((a, b) => b.evaluation.getScore() - a.evaluation.getScore());

    const bestActionIntentOption = evaluatedIntents[0]?.intent || null;

    if (bestActionIntentOption === null) {
      console.info("no healing action found");
    }

    return bestActionIntentOption;
  }
}
