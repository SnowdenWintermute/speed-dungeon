import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant } from "../../../combatants/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { HealingActionEvaluator } from "./healing-action-evaluator.js";
import { AiActionEvaluator } from "./index.js";

export enum ActionComparatorTypes {
  MostHealingOnLowestTarget,
}

export const ACTION_EVALUATORS: Record<ActionComparatorTypes, AiActionEvaluator> = {
  [ActionComparatorTypes.MostHealingOnLowestTarget]: function (
    intents: CombatActionExecutionIntent[],
    actionUserContext: ActionUserContext,
    consideredCombatants: Combatant[]
  ): null | CombatActionExecutionIntent {
    return HealingActionEvaluator.evaluateActionIntents(
      intents,
      actionUserContext,
      consideredCombatants
    );
  },
};
