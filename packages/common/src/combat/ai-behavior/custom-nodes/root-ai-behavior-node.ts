import { AiType, Combatant } from "../../../combatants/index.js";
import {
  FriendOrFoe,
  TargetCategories,
} from "../../combat-actions/targeting-schemes-and-categories.js";
import {
  ACTION_EVALUATORS,
  ActionEvaluatorTypes,
} from "../ai-action-selector/action-evaluators.js";
import { CombatantFilterFactory } from "../ai-action-selector/combatant-filter-factory.js";
import {
  HealingActionEvaluator,
  NEEDS_HEALING_HP_NORMALIZED_PERCENTAGE,
} from "../ai-action-selector/healing-action-evaluator.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState, SelectorNode } from "../behavior-tree.js";
import { ActionSelectorNode } from "./action-selector-node.js";

export class RootAIBehaviorNode implements BehaviorNode {
  private root: BehaviorNode;
  constructor(private behaviorContext: AIBehaviorContext) {
    const { actionUserContext } = this.behaviorContext;
    const { actionUser } = actionUserContext;

    // @TODO pet command handling - can be used for "confuse" and "fear" conditions also
    // - check conditions for temporary AiTypes
    // - replace combatant's default AiTypes with those

    const { aiTypes } = actionUser.getCombatantProperties().controlledBy;

    const targetSelectionSchemes: BehaviorNode[] = [];

    const isOpponentFilter = CombatantFilterFactory.createIsInTargetCategoryFilter(
      TargetCategories.Opponent,
      actionUserContext
    );

    if (aiTypes?.includes(AiType.TargetPetOwnerMostRecentTarget)) {
      const recentHostileTargetOfPetOwnerFilter =
        CombatantFilterFactory.createIsRecentTargetOfPetOwner(
          actionUserContext,
          FriendOrFoe.Hostile
        );

      targetSelectionSchemes.push(
        new ActionSelectorNode(
          this.behaviorContext,
          [recentHostileTargetOfPetOwnerFilter, isOpponentFilter],
          ACTION_EVALUATORS[ActionEvaluatorTypes.RandomMaliciousAction]
        )
      );
    }

    if (aiTypes?.includes(AiType.Healer)) {
      const isFriendlyFilter = CombatantFilterFactory.createIsInTargetCategoryFilter(
        TargetCategories.Friendly,
        actionUserContext
      );

      const needsHealingFilter = CombatantFilterFactory.createBelowHpThresholdFilter(
        NEEDS_HEALING_HP_NORMALIZED_PERCENTAGE
      );

      targetSelectionSchemes.push(
        new ActionSelectorNode(
          this.behaviorContext,
          [isFriendlyFilter, needsHealingFilter],
          HealingActionEvaluator.evaluateActionIntents
        )
      );
    }

    targetSelectionSchemes.push(
      new ActionSelectorNode(
        this.behaviorContext,
        [CombatantFilterFactory.createIsTopOfThreatMeterFilter(actionUserContext)],
        ACTION_EVALUATORS[ActionEvaluatorTypes.RandomMaliciousAction]
      )
    );

    targetSelectionSchemes.push(
      new ActionSelectorNode(
        this.behaviorContext,
        [isOpponentFilter],
        ACTION_EVALUATORS[ActionEvaluatorTypes.RandomMaliciousAction]
      )
    );

    this.root = new SelectorNode(targetSelectionSchemes);
  }

  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}
