import { Combatant } from "../../../combatants/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class SelectActionWithPotentialTargets implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant
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

    this.behaviorContext.selectedActionWithPotentialValidTargets = {
      actionName: actionNameOption,
      potentialValidTargets,
    };

    return BehaviorNodeState.Success;
  }
}
