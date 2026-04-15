import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant } from "../../../combatants/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { COMBAT_ACTION_NAME_STRINGS } from "../../combat-actions/combat-action-names.js";
import { PotentialTotalResourceChangeEvaluation } from "./potential-total-resource-change-evaluation.js";
import { ResourceChangeActionEvaluator } from "./resource-change-action-evaluator.js";

export interface ResourceChangeEfficiencyEvaluation {
  max: number;
  average: number;
  averageManaPricePerPoint: number;
}

export interface ResourceChangeEvaluationWeights {
  avgPrimary: number;
  maxPrimary: number;
  avgTotal: number;
  maxTotal: number;
  efficiency: number;
  efficiencyBonusCap: number;
}

export class DamageActionEvaluator extends ResourceChangeActionEvaluator {
  static DAMAGE_EVALUATION_WEIGHTS: ResourceChangeEvaluationWeights = {
    avgPrimary: 1.0,
    maxPrimary: 0.5,
    avgTotal: 0.0,
    maxTotal: 0.0,
    efficiency: 0.0,
    efficiencyBonusCap: 5,
  };

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

    console.log(
      "mainTarget:",
      mainTarget.getEntityId(),
      "HP",
      mainTarget.combatantProperties.resources.getHitPoints()
    );

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

      console.log(
        COMBAT_ACTION_NAME_STRINGS[actionExecutionIntent.actionName],
        "averageHitPointChanges:",
        averageHitPointChanges,
        "maxHitPointChanges",
        maxHitPointChanges
      );

      if (!averageHitPointChanges || !maxHitPointChanges) {
        continue;
      }

      const resourceCosts = action.costProperties.getResourceCosts(actionUser, true, rank);
      const manaCost = resourceCosts?.[CombatActionResource.Mana] ?? 0;
      const evaluation = new PotentialTotalResourceChangeEvaluation(manaCost);

      for (const targetCombatant of consideredCombatants) {
        const targetId = targetCombatant.entityProperties.id;
        const { resources } = targetCombatant.combatantProperties;
        const hitPoints = resources.getHitPoints();

        const remainingHitPoints = hitPoints;

        // if number would be positive it is healing and we don't want to give it a good score
        // so make it 0, do same for max damage
        const averageDamage = Math.min(0, averageHitPointChanges.getRecord(targetId)?.value || 0);
        const averageEffectiveDamage = Math.max(remainingHitPoints * -1, averageDamage);

        const maxDamage = Math.min(0, maxHitPointChanges.getRecord(targetId)?.value || 0);
        const maxEffectiveDamage = Math.max(remainingHitPoints * -1, maxDamage);

        console.log(
          COMBAT_ACTION_NAME_STRINGS[actionName],
          "potential target:",
          targetCombatant.getEntityId(),
          "hp:",
          hitPoints,
          "maxDamage",
          maxDamage,
          "maxEffectiveDamage",
          maxEffectiveDamage
        );

        if (targetId === mainTarget.entityProperties.id) {
          evaluation.setPrimaryTargetEfficiencyEvaluation(
            maxEffectiveDamage,
            averageEffectiveDamage
          );
        }

        evaluation.setOrUpdateTotalAcrossAllTargets(maxEffectiveDamage, averageEffectiveDamage);
      }

      evaluation.computeEfficiencyAcrossAllTargets();

      const evaluatedIntent = {
        intent: actionExecutionIntent,
        evaluation,
      };

      evaluatedIntents.push(evaluatedIntent);
    }

    evaluatedIntents.sort((a, b) => b.evaluation.getScore() - a.evaluation.getScore());

    const bestActionIntentOption = evaluatedIntents[0]?.intent || null;
    return bestActionIntentOption;
  }
}
