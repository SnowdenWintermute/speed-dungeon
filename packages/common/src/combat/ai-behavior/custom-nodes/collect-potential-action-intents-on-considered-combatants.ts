import { ArrayUtils, iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";
import { PotentialTotalHealingEvaluation } from "./collect-potential-healing-from-considered-actions.js";

export class CollectPotentialActionIntentsOnConsideredCombatants implements BehaviorNode {
  constructor(private behaviorContext: AIBehaviorContext) {}
  execute(): BehaviorNodeState {
    const collected: {
      intent: CombatActionExecutionIntent;
      healingEvaluation: PotentialTotalHealingEvaluation;
    }[] = [];

    const targetingCalculator = new TargetingCalculator(
      this.behaviorContext.actionUserContext,
      null
    );

    const consideredCombatantIds = this.behaviorContext.consideredCombatants.map((combatant) =>
      combatant.getEntityId()
    );

    for (const [actionName, potentialTargets] of iterateNumericEnumKeyedRecord(
      this.behaviorContext.usableActionsWithPotentialValidTargets
    )) {
      for (const target of potentialTargets) {
        const targetIds = targetingCalculator.getCombatActionTargetIds(
          COMBAT_ACTIONS[actionName],
          target
        );
        if (targetIds instanceof Error) {
          throw targetIds;
        }

        if (ArrayUtils.overlaps(targetIds, consideredCombatantIds)) {
          // @TODO - consider all action ranks
          const actionExecutionIntent = new CombatActionExecutionIntent(actionName, 1, target);

          const consideredIntent = {
            intent: actionExecutionIntent,
            healingEvaluation: new PotentialTotalHealingEvaluation(0),
          };
          console.log("considered action intent collected:", consideredIntent);
          collected.push(consideredIntent);
        }
      }
    }

    if (collected.length > 0) {
      this.behaviorContext.consideredActionIntents.push(...collected);
      return BehaviorNodeState.Success;
    }
    return BehaviorNodeState.Failure;
  }
}
