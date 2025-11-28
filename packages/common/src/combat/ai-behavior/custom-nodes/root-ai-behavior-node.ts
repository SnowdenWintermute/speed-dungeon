import { AiType, Combatant } from "../../../combatants/index.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import { TargetCategories } from "../../combat-actions/targeting-schemes-and-categories.js";
import { CombatantFilterFactory } from "../ai-action-selector/combatant-filter-factory.js";
import {
  HealingActionEvaluator,
  NEEDS_HEALING_HP_PERCENTAGE,
} from "../ai-action-selector/healing-action-evaluator.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState, SelectorNode } from "../behavior-tree.js";
import { ActionSelectorNode } from "./action-selector-node.js";
import { SelectActionToTargetPetOwnerMostRecentTarget } from "./select-action-to-damage-pet-owner-recent-target.js";
import { SelectTopThreatTargetAndAction } from "./select-highest-threat-target.js";

export class RootAIBehaviorNode implements BehaviorNode {
  private root: BehaviorNode;
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant
  ) {
    const targetSelectionSchemes: BehaviorNode[] = [];

    // @TODO pet command handling - can be used for "confuse" and "fear" conditions also
    // - check conditions for temporary AiTypes
    // - replace combatant's default AiTypes with those
    const { aiTypes } = combatant.combatantProperties.controlledBy;

    if (aiTypes?.includes(AiType.TargetPetOwnerMostRecentTarget)) {
      targetSelectionSchemes.push(
        new SelectActionToTargetPetOwnerMostRecentTarget(this.behaviorContext, this.combatant)
      );
    }

    const { actionUserContext } = this.behaviorContext;

    if (aiTypes?.includes(AiType.Healer)) {
      targetSelectionSchemes.push(
        new ActionSelectorNode(
          this.behaviorContext,
          [
            CombatantFilterFactory.createIsInTargetCategoryFilter(
              TargetCategories.Friendly,
              actionUserContext
            ),
            CombatantFilterFactory.createBelowHpThresholdFilter(NEEDS_HEALING_HP_PERCENTAGE),
          ],
          HealingActionEvaluator.evaluateActionIntents
        )
      );
    }

    targetSelectionSchemes.push(
      new SelectTopThreatTargetAndAction(this.behaviorContext, this.combatant, [
        CombatActionIntent.Malicious,
      ])
    );

    // targetSelectionSchemes.push(
    //   new SelectRandomActionAndTargets(this.behaviorContext, this.combatant, [
    //     CombatActionIntent.Malicious,
    //   ])
    // );

    this.root = new SelectorNode(targetSelectionSchemes);
  }
  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}
