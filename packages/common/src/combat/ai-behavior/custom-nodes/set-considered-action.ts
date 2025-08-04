import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class SetConsideredAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private actionNameGetter: () => undefined | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    const actionName = this.actionNameGetter();
    if (actionName === undefined) {
      console.log("no action name to set as considered");
      return BehaviorNodeState.Failure;
    }
    this.behaviorContext.setCurrentActionNameConsidering(actionName);
    return BehaviorNodeState.Success;
  }
}
