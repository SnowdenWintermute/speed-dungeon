import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class SetConsideredAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private actionNameGetter: () => undefined | CombatActionName,
    private actionLevelGetter: () => null | number
  ) {}
  execute(): BehaviorNodeState {
    const actionName = this.actionNameGetter();
    if (actionName === undefined) {
      return BehaviorNodeState.Failure;
    }
    this.behaviorContext.setCurrentActionNameConsidering(actionName);
    const level = this.actionLevelGetter();
    if (level === null) {
      return BehaviorNodeState.Failure;
    }
    this.behaviorContext.setCurrentActionLevelConsidering(level);
    return BehaviorNodeState.Success;
  }
}
