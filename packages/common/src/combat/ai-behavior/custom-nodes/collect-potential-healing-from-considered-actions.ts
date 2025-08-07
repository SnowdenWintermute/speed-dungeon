import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import { FixedNumberGenerator } from "../../../utility-classes/randomizers.js";
import { iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import { HitOutcomeCalculator } from "../../action-results/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

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

const HEALING_EVALUATION_WEIGHTS: HealingEvaluationWeights = {
  avgPrimary: 1.0,
  maxPrimary: 0.5,
  avgTotal: 0.8,
  maxTotal: 0.3,
  efficiency: 0.25,
  efficiencyBonusCap: 5,
};

export class PotentialTotalHealingEvaluation {
  onPrimaryTarget: null | HealingEvaluationOnTargets = null;
  totalAcrossAllies: null | HealingEvaluationOnTargets = null;
  constructor(private manaCost: number) {}

  setPrimaryTargetHealing(max: number, average: number) {
    const averageManaPricePerPointHealed = average / this.manaCost;
    this.onPrimaryTarget = { max, average, averageManaPricePerPointHealed };
  }
  setOrUpdateTotalAcrossAllies(max: number, average: number) {
    if (this.totalAcrossAllies === null)
      this.totalAcrossAllies = { max: 0, average: 0, averageManaPricePerPointHealed: 0 };

    this.totalAcrossAllies.average += average;
    this.totalAcrossAllies.max += max;

    this.totalAcrossAllies.averageManaPricePerPointHealed =
      this.manaCost / this.totalAcrossAllies.average;
  }

  getEvaluations() {
    return { onPrimaryTarget: this.onPrimaryTarget, totalAcrossAllies: this.totalAcrossAllies };
  }

  getScore(weights: HealingEvaluationWeights = HEALING_EVALUATION_WEIGHTS) {
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

export class CollectPotentialHealingFromConsideredActions implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private mainHealingTargetGetter: (behaviorContext: AIBehaviorContext) => undefined | Combatant
  ) {}
  execute(): BehaviorNodeState {
    const mainHealingTarget = this.mainHealingTargetGetter(this.behaviorContext);
    if (mainHealingTarget === undefined) return BehaviorNodeState.Failure;

    const collected: {
      intent: CombatActionExecutionIntent;
      healingEvaluation: PotentialTotalHealingEvaluation;
    }[] = [];

    for (const [actionName, potentialTargets] of iterateNumericEnumKeyedRecord(
      this.behaviorContext.usableActionsWithPotentialValidTargets
    )) {
      const action = COMBAT_ACTIONS[actionName];
      for (const target of potentialTargets) {
        // @TODO - evaluate every owned spell level
        const actionExecutionIntent = new CombatActionExecutionIntent(actionName, target, 1);
        const averageHitOutcomeCalculator = new HitOutcomeCalculator(
          this.behaviorContext.combatantContext,
          actionExecutionIntent,
          new FixedNumberGenerator(0.5)
        );

        const maxHitOutcomeCalculator = new HitOutcomeCalculator(
          this.behaviorContext.combatantContext,
          actionExecutionIntent,
          new FixedNumberGenerator(0.999)
        );

        const averageHitOutcomes = averageHitOutcomeCalculator.calculateHitOutcomes();
        const maxHitOutcomes = maxHitOutcomeCalculator.calculateHitOutcomes();
        const averageHitPointChanges =
          averageHitOutcomes.resourceChanges?.[CombatActionResource.HitPoints];
        const maxHitPointChanges = maxHitOutcomes.resourceChanges?.[CombatActionResource.HitPoints];
        if (!averageHitPointChanges || !maxHitPointChanges) continue;

        const resourceCosts = action.costProperties.getResourceCosts(
          this.combatant.combatantProperties,
          true
        );
        const manaCost = resourceCosts?.[CombatActionResource.Mana] ?? 0;
        const potentialHealingEvaluation = new PotentialTotalHealingEvaluation(manaCost);

        for (const allyCombatant of this.behaviorContext.consideredCombatants) {
          const allyId = allyCombatant.entityProperties.id;
          const { hitPoints } = allyCombatant.combatantProperties;
          const maxHitPoints = CombatantProperties.getTotalAttributes(
            allyCombatant.combatantProperties
          )[CombatAttribute.Hp];
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

        const consideredIntent = {
          intent: actionExecutionIntent,
          healingEvaluation: potentialHealingEvaluation,
        };
        collected.push(consideredIntent);
      }
    }

    if (Object.values(collected).length > 0) {
      this.behaviorContext.consideredActionIntents.push(...collected);
      return BehaviorNodeState.Success;
    }
    return BehaviorNodeState.Failure;
  }
}
