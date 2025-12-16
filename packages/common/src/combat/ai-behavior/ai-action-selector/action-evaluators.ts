import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant } from "../../../combatants/index.js";
import { ArrayUtils } from "../../../utils/array-utils.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import { ActionPayableResource } from "../../combat-actions/index.js";
import { DamageActionEvaluator } from "./damage-action-evaluator.js";
import { HealingActionEvaluator } from "./healing-action-evaluator.js";
import { AiActionEvaluator } from "./index.js";

export enum ActionEvaluatorTypes {
  MostHealingOnLowestTarget,
  RandomMaliciousAction,
  RandomManaCostingMaliciousAction,
  MostDamageOnLowestHitPointTarget,
}

export const ACTION_EVALUATORS: Record<ActionEvaluatorTypes, AiActionEvaluator> = {
  [ActionEvaluatorTypes.MostHealingOnLowestTarget]: function (
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
  [ActionEvaluatorTypes.MostDamageOnLowestHitPointTarget]: function (
    intents: CombatActionExecutionIntent[],
    actionUserContext: ActionUserContext,
    consideredCombatants: Combatant[]
  ): null | CombatActionExecutionIntent {
    return DamageActionEvaluator.evaluateActionIntents(
      intents,
      actionUserContext,
      consideredCombatants
    );
  },
  [ActionEvaluatorTypes.RandomMaliciousAction]: function (
    intents: CombatActionExecutionIntent[],
    actionUserContext: ActionUserContext,
    consideredCombatants: Combatant[]
  ): null | CombatActionExecutionIntent {
    const { actionUser } = actionUserContext;

    const filtered = intents.filter((intent) => {
      const action = COMBAT_ACTIONS[intent.actionName];
      return action.targetingProperties.intent === CombatActionIntent.Malicious;
    });

    ArrayUtils.shuffle(filtered);

    const chosen = filtered[0];
    return chosen || null;
  },
  [ActionEvaluatorTypes.RandomManaCostingMaliciousAction]: function (
    intents: CombatActionExecutionIntent[],
    actionUserContext: ActionUserContext,
    consideredCombatants: Combatant[]
  ): null | CombatActionExecutionIntent {
    const filtered = intents.filter((intent) => {
      const action = COMBAT_ACTIONS[intent.actionName];
      const isMalicious = action.targetingProperties.intent === CombatActionIntent.Malicious;
      const costsMana = action.costProperties.costBases[ActionPayableResource.Mana] !== undefined;
      return costsMana && isMalicious;
    });

    ArrayUtils.shuffle(filtered);

    const chosen = filtered[0];
    return chosen || null;
  },
};
