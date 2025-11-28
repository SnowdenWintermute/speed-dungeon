import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant, CombatAttribute } from "../../../combatants/index.js";
import { NormalizedPercentage } from "../../../primatives/index.js";
import { FixedNumberGenerator } from "../../../utility-classes/randomizers.js";
import { HitOutcomeCalculator } from "../../action-results/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";

export const NEEDS_HEALING_HP_PERCENTAGE: NormalizedPercentage = 0.7;

export interface HealingEvaluationOnTargets {
  max: number;
  average: number;
  averageManaPricePerPointHealed: number;
}

export interface HealingEvaluationWeights {
  avgPrimary: number;
  maxPrimary: number;
  avgTotal: number;
  maxTotal: number;
  efficiency: number;
  efficiencyBonusCap: number;
}

export class HealingActionEvaluator {
  static HEALING_EVALUATION_WEIGHTS: HealingEvaluationWeights = {
    avgPrimary: 1.0,
    maxPrimary: 0.5,
    avgTotal: 0.8,
    maxTotal: 0.3,
    efficiency: 0.25,
    efficiencyBonusCap: 5,
  };

  private static getLowestHpCombatant(combatants: Combatant[]) {
    let mainHealingTarget: Combatant | null = null;
    for (const combatant of combatants) {
      if (
        mainHealingTarget === null ||
        combatant.combatantProperties.resources.getHitPoints() <
          mainHealingTarget.combatantProperties.resources.getHitPoints()
      ) {
        mainHealingTarget = combatant;
      }
    }
    return mainHealingTarget;
  }

  static evaluateActionIntents(
    intents: CombatActionExecutionIntent[],
    actionUserContext: ActionUserContext,
    consideredCombatants: Combatant[]
  ) {
    const mainHealingTarget = HealingActionEvaluator.getLowestHpCombatant(consideredCombatants);
    if (mainHealingTarget === null) {
      return null;
    }

    const evaluatedIntents: {
      intent: CombatActionExecutionIntent;
      healingEvaluation: PotentialTotalHealingEvaluation;
    }[] = [];

    const { actionUser } = actionUserContext;

    for (const actionExecutionIntent of intents) {
      const { actionName, rank } = actionExecutionIntent;
      const action = COMBAT_ACTIONS[actionName];

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
      const averageHitPointChanges =
        averageHitOutcomes.resourceChanges?.[CombatActionResource.HitPoints];

      const maxHitPointChanges = maxHitOutcomes.resourceChanges?.[CombatActionResource.HitPoints];

      if (!averageHitPointChanges || !maxHitPointChanges) {
        continue;
      }

      const resourceCosts = action.costProperties.getResourceCosts(actionUser, true, rank);
      const manaCost = resourceCosts?.[CombatActionResource.Mana] ?? 0;
      const potentialHealingEvaluation = new PotentialTotalHealingEvaluation(manaCost);

      for (const allyCombatant of consideredCombatants) {
        const allyId = allyCombatant.entityProperties.id;
        const { attributeProperties, resources } = allyCombatant.combatantProperties;
        const hitPoints = resources.getHitPoints();
        const maxHitPoints = attributeProperties.getAttributeValue(CombatAttribute.Hp);
        const missingHitPoints = Math.max(0, maxHitPoints - hitPoints);

        const averageHealing = averageHitPointChanges.getRecord(allyId)?.value || 0;
        const averageEffectiveHealing = Math.min(missingHitPoints, averageHealing);
        const maxHealing = maxHitPointChanges.getRecord(allyId)?.value || 0;
        const maxEffectiveHealing = Math.min(missingHitPoints, maxHealing);

        if (allyId === mainHealingTarget.entityProperties.id) {
          potentialHealingEvaluation.setPrimaryTargetHealing(
            maxEffectiveHealing,
            averageEffectiveHealing
          );
        }

        potentialHealingEvaluation.setOrUpdateTotalAcrossAllies(
          maxEffectiveHealing,
          averageEffectiveHealing
        );
      }

      potentialHealingEvaluation.computeHealingOnAllAlliesEfficiency();

      const evaluatedIntent = {
        intent: actionExecutionIntent,
        healingEvaluation: potentialHealingEvaluation,
      };

      evaluatedIntents.push(evaluatedIntent);
    }

    evaluatedIntents.sort(
      (a, b) => b.healingEvaluation.getScore() - a.healingEvaluation.getScore()
    );

    const bestActionIntentOption = evaluatedIntents[0]?.intent || null;
    return bestActionIntentOption;
  }
}

export class PotentialTotalHealingEvaluation {
  onPrimaryTarget: null | HealingEvaluationOnTargets = null;
  totalAcrossAllies: null | HealingEvaluationOnTargets = null;
  constructor(private manaCost: number) {}

  private static EPSILON = 0.0001;

  setPrimaryTargetHealing(max: number, average: number) {
    const averageManaPricePerPointHealed =
      this.manaCost / (average || PotentialTotalHealingEvaluation.EPSILON);
    this.onPrimaryTarget = { max, average, averageManaPricePerPointHealed };
  }

  setOrUpdateTotalAcrossAllies(max: number, average: number) {
    if (this.totalAcrossAllies === null) {
      this.totalAcrossAllies = { max: 0, average: 0, averageManaPricePerPointHealed: 0 };
    }

    this.totalAcrossAllies.average += average;
    this.totalAcrossAllies.max += max;
  }

  computeHealingOnAllAlliesEfficiency() {
    if (!this.totalAcrossAllies) {
      return;
    }

    this.totalAcrossAllies.averageManaPricePerPointHealed =
      this.manaCost / (this.totalAcrossAllies.average || PotentialTotalHealingEvaluation.EPSILON);
  }

  getEvaluations() {
    return { onPrimaryTarget: this.onPrimaryTarget, totalAcrossAllies: this.totalAcrossAllies };
  }

  getScore(weights: HealingEvaluationWeights = HealingActionEvaluator.HEALING_EVALUATION_WEIGHTS) {
    const { onPrimaryTarget, totalAcrossAllies } = this;

    let score = 0;

    if (onPrimaryTarget) {
      score += weights.avgPrimary * onPrimaryTarget.average;
      score += weights.maxPrimary * onPrimaryTarget.max;
    }

    if (totalAcrossAllies) {
      score += weights.avgTotal * totalAcrossAllies.average;
      score += weights.maxTotal * totalAcrossAllies.max;
      if (totalAcrossAllies.averageManaPricePerPointHealed)
        score += weights.efficiency * (1 / totalAcrossAllies.averageManaPricePerPointHealed);
      else score += weights.efficiency * weights.efficiencyBonusCap;
    }

    return score;
  }
}
