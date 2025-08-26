import { Combatant } from "../../../combatants/index.js";
import { CombatActionName } from "../../combat-actions/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class CheckIfActionUsableInCurrentContext implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private _combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) {
      console.log("no action name passed");
      return BehaviorNodeState.Failure;
    }
    const action = COMBAT_ACTIONS[this.actionNameOption];
    const usable = action.isUsableInThisContext(this.behaviorContext.battleOption);
    if (usable) return BehaviorNodeState.Success;
    console.log("not usable in this context");
    return BehaviorNodeState.Failure;
  }
}
