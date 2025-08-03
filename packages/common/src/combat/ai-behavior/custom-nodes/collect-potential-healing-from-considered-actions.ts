import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import { HitOutcome } from "../../../hit-outcome.js";
import { FixedNumberGenerator } from "../../../utility-classes/randomizers.js";
import { iterateNumericEnumKeyedRecord, throwIfError } from "../../../utils/index.js";
import { HitOutcomeCalculator } from "../../action-results/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { CombatActionResource } from "../../combat-actions/combat-action-hit-outcome-properties.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
} from "../../targeting/combat-action-targets.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export interface HealingEvaluationOnTargets {
  max: number;
  average: number;
  averageManaPricePerPointHealed: number;
}

export class PotentialTotalHealingEvaluation {
  onPrimaryTarget: null | HealingEvaluationOnTargets = null;
  totalAcrossAllies: null | HealingEvaluationOnTargets = null;
  constructor(private manaCost: number) {}

  setPrimaryTargetHealing(max: number, average: number) {
    const averageManaPricePerPointHealed = (average = this.manaCost);
    this.onPrimaryTarget = { max, average, averageManaPricePerPointHealed };
  }
  setOrUpdateTotalAcrossAllies(max: number, average: number, manaCost: number) {
    if (this.totalAcrossAllies === null)
      this.totalAcrossAllies = { max, average, averageManaPricePerPointHealed: 0 };
    else {
      this.totalAcrossAllies.max += max;
      this.totalAcrossAllies.max += average;
    }
    this.totalAcrossAllies.averageManaPricePerPointHealed =
      this.manaCost / this.totalAcrossAllies.average;
  }
}

export class CollectPotentialHealingFromConsideredActions implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private mainHealingTarget: Combatant
  ) {}
  execute(): BehaviorNodeState {
    const collected: Partial<
      Record<
        CombatActionName,
        {
          target: CombatActionTarget;
          potentialHealingEvaluation: PotentialTotalHealingEvaluation;
        }[]
      >
    > = {};

    const targetingCalculator = new TargetingCalculator(
      this.behaviorContext.combatantContext,
      null
    );

    for (const [actionName, potentialTargets] of iterateNumericEnumKeyedRecord(
      this.behaviorContext.usableActionsWithPotentialValidTargets
    )) {
      const action = COMBAT_ACTIONS[actionName];
      for (const target of potentialTargets) {
        const targetIds = throwIfError(
          targetingCalculator.getCombatActionTargetIds(action, target)
        );

        const resourceCosts = action.costProperties.getResourceCosts(
          this.combatant.combatantProperties
        );
        const manaCost = resourceCosts?.[CombatActionResource.Mana] ?? 0;
        const potentialHealingEvaluation = new PotentialTotalHealingEvaluation(manaCost);

        const averageHitOutcomeCalculator = new HitOutcomeCalculator(
          this.behaviorContext.combatantContext,
          new CombatActionExecutionIntent(CombatActionName.PassTurn, {
            type: CombatActionTargetType.Single,
            targetId: this.combatant.entityProperties.id,
          }),
          new FixedNumberGenerator(0.5)
        );

        const maxHitOutcomeCalculator = new HitOutcomeCalculator(
          this.behaviorContext.combatantContext,
          new CombatActionExecutionIntent(CombatActionName.PassTurn, {
            type: CombatActionTargetType.Single,
            targetId: this.combatant.entityProperties.id,
          }),
          new FixedNumberGenerator(1)
        );

        const averageHitOutcomes = averageHitOutcomeCalculator.calculateHitOutcomes();
        const maxHitOutcomes = maxHitOutcomeCalculator.calculateHitOutcomes();

        for (const targetId of averageHitOutcomes.outcomeFlags?.[HitOutcome.Hit] ?? []) {
          const targetCombatant = AdventuringParty.getExpectedCombatant(
            this.behaviorContext.combatantContext.party,
            targetId
          );
          const { hitPoints } = targetCombatant.combatantProperties;
          const maxHitPoints = CombatantProperties.getTotalAttributes(
            targetCombatant.combatantProperties
          )[CombatAttribute.Hp];
          const missingHitPoints = Math.max(0, maxHitPoints - hitPoints);

          // get average total healing on this target
          // get max total healing on this target
          if (targetId === this.mainHealingTarget.entityProperties.id) {
          }
        }
      }
    }

    if (Object.values(collected).length > 0) return BehaviorNodeState.Success;
    return BehaviorNodeState.Failure;
  }
}
