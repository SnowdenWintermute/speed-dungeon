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
import { AiType } from "../index.js";
import { ActionSelectorNode } from "./action-selector-node.js";

export class RootAIBehaviorNode implements BehaviorNode {
  private root: BehaviorNode;
  constructor(private behaviorContext: AIBehaviorContext) {
    const { actionUserContext } = this.behaviorContext;
    const { actionUser } = actionUserContext;

    const aiTypes = actionUser.getCombatantProperties().controlledBy.getAiTypes();

    const targetSelectionSchemes: BehaviorNode[] = [];

    const isOpponentFilter = CombatantFilterFactory.createIsInTargetCategoryFilter(
      TargetCategories.Opponent,
      actionUserContext
    );

    if (aiTypes?.includes(AiType.AlwaysPassTurn)) {
      // no valid behaviors should result in a pass turn by default
      this.root = new SelectorNode([]);
      return;
    }

    if (aiTypes?.includes(AiType.TargetLowestHpEnemy)) {
      targetSelectionSchemes.push(
        new ActionSelectorNode(
          this.behaviorContext,
          [isOpponentFilter],
          ACTION_EVALUATORS[ActionEvaluatorTypes.MostDamageOnLowestHitPointTarget]
        )
      );
    }

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

    if (aiTypes?.includes(AiType.PrefersAttackWithMana)) {
      targetSelectionSchemes.push(
        new ActionSelectorNode(
          this.behaviorContext,
          [
            isOpponentFilter,
            CombatantFilterFactory.createIsTopOfThreatMeterFilter(actionUserContext),
          ],
          ACTION_EVALUATORS[ActionEvaluatorTypes.RandomManaCostingMaliciousAction]
        )
      );
    }

    targetSelectionSchemes.push(
      new ActionSelectorNode(
        this.behaviorContext,
        [
          isOpponentFilter,
          CombatantFilterFactory.createIsTopOfThreatMeterFilter(actionUserContext),
        ],
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
