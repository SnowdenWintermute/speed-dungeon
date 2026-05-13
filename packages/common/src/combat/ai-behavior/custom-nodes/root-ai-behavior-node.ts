import { Combatant } from "../../../index.js";
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
import { AI_BEHAVIOR_TYPE_STRINGS, AiType } from "../index.js";
import { ActionSelectorNode } from "./action-selector-node.js";

// want to cast webs on non-webbed enemies 75% of the time
// get all opponents tied for top of threat meter
// get all opponents that are targetable by web
// check their conditions to see if they are webbed
// roll to see if want to cast web
// if yes, cast web
// else, evaluate highest damage action on target

export class RootAIBehaviorNode implements BehaviorNode {
  private root: BehaviorNode;
  constructor(private behaviorContext: AIBehaviorContext) {
    const { actionUserContext } = this.behaviorContext;
    const { actionUser } = actionUserContext;

    const aiBehaviorActionSelectorNodeFactory = new AiBehaviorActionSelectorNodeFactory(
      behaviorContext
    );

    const aiTypes = actionUser.getCombatantProperties().controlledBy.getAiTypes();

    const targetSelectionSchemes: BehaviorNode[] = [];

    if (aiTypes[0] !== AiType.AlwaysPassTurn) {
      for (const aiType of aiTypes) {
        targetSelectionSchemes.push(aiBehaviorActionSelectorNodeFactory.createNode(aiType));
      }
    } else {
      // AI IS SET TO ALWAYS PASS TURN
    }

    this.root = new SelectorNode(targetSelectionSchemes);
  }

  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}

class AiBehaviorActionSelectorNodeFactory {
  private aiBehaviorNodeCreators: Record<AiType, BehaviorNode>;

  private isFriendlyFilter: (combatant: Combatant) => boolean;
  private needsHealingFilter: (combatant: Combatant) => boolean;
  private isOpponentFilter: (combatant: Combatant) => boolean;
  private recentHostileTargetOfPetOwnerFilter: (combatant: Combatant) => boolean;

  constructor(private behaviorContext: AIBehaviorContext) {
    const { actionUserContext } = behaviorContext;

    this.isOpponentFilter = CombatantFilterFactory.createIsInTargetCategoryFilter(
      TargetCategories.Opponent,
      actionUserContext
    );

    this.isFriendlyFilter = CombatantFilterFactory.createIsInTargetCategoryFilter(
      TargetCategories.Friendly,
      actionUserContext
    );

    this.needsHealingFilter = CombatantFilterFactory.createBelowHpThresholdFilter(
      NEEDS_HEALING_HP_NORMALIZED_PERCENTAGE
    );

    this.recentHostileTargetOfPetOwnerFilter =
      CombatantFilterFactory.createIsRecentTargetOfPetOwner(actionUserContext, FriendOrFoe.Hostile);

    this.aiBehaviorNodeCreators = {
      [AiType.Healer]: new ActionSelectorNode(
        this.behaviorContext,
        AiType.Healer,
        [this.isFriendlyFilter, this.needsHealingFilter],
        HealingActionEvaluator.evaluateActionIntents
      ),
      [AiType.AlwaysPassTurn]: new SelectorNode([]), // actually this doesn't work since we don't really select the pass turn action here
      [AiType.TargetLowestHpEnemy]: new ActionSelectorNode(
        this.behaviorContext,
        AiType.TargetLowestHpEnemy,
        [this.isOpponentFilter],
        ACTION_EVALUATORS[ActionEvaluatorTypes.MostDamageOnLowestHitPointTarget]
      ),
      [AiType.PrefersAttackWithMana]: new ActionSelectorNode(
        this.behaviorContext,
        AiType.PrefersAttackWithMana,
        [
          this.isOpponentFilter,
          CombatantFilterFactory.createIsTopOfThreatMeterFilter(actionUserContext),
        ],
        ACTION_EVALUATORS[ActionEvaluatorTypes.RandomManaCostingMaliciousAction]
      ),

      [AiType.RandomMaliciousAction]: new ActionSelectorNode(
        this.behaviorContext,
        AiType.RandomMaliciousAction,
        [this.isOpponentFilter],
        ACTION_EVALUATORS[ActionEvaluatorTypes.RandomMaliciousAction]
      ),

      [AiType.TargetTopOfThreatMeter]: new ActionSelectorNode(
        this.behaviorContext,
        AiType.TargetTopOfThreatMeter,
        [
          this.isOpponentFilter,
          CombatantFilterFactory.createIsTopOfThreatMeterFilter(actionUserContext),
        ],
        ACTION_EVALUATORS[ActionEvaluatorTypes.RandomMaliciousAction]
      ),
      [AiType.TargetPetOwnerMostRecentTarget]: new ActionSelectorNode(
        this.behaviorContext,
        AiType.TargetPetOwnerMostRecentTarget,
        [this.recentHostileTargetOfPetOwnerFilter, this.isOpponentFilter],
        ACTION_EVALUATORS[ActionEvaluatorTypes.RandomMaliciousAction] // so they can use web or other non-damaging actions
      ),
    };
  }

  createNode(aiType: AiType) {
    return this.aiBehaviorNodeCreators[aiType];
  }
}
