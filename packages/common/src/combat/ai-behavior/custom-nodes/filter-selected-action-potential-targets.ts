import { Combatant } from "../../../combatants/index.js";
import { CombatActionTarget } from "../../targeting/combat-action-targets.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class FilterSelectedActionPotentialTargets implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private filteringFunction: (
      target: CombatActionTarget,
      behaviorContext: AIBehaviorContext
    ) => boolean
  ) {}
  execute(): BehaviorNodeState {
    const actionNameOption = this.behaviorContext.currentActionNameConsidering;
    if (actionNameOption === null) return BehaviorNodeState.Failure;

    const potentialValidTargets =
      this.behaviorContext.usableActionsWithPotentialValidTargets[actionNameOption];

    if (potentialValidTargets === undefined) {
      throw new Error(
        "expected usableActionsWithPotentialValidTargets to contain the action name passed to this node"
      );
    }

    const filteredTargets = potentialValidTargets.filter((target) =>
      this.filteringFunction(target, this.behaviorContext)
    );

    if (filteredTargets.length === 0) return BehaviorNodeState.Failure;

    this.behaviorContext.selectedActionWithPotentialValidTargets = {
      actionName: actionNameOption,
      potentialValidTargets: filteredTargets,
    };

    return BehaviorNodeState.Success;
  }
}
