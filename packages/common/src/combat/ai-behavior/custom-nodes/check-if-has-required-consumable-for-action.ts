import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import { CombatActionName } from "../../combat-actions/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class CheckIfHasRequiredConsumablesForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;

    const hasRequiredConsumables = CombatantProperties.hasRequiredConsumablesToUseAction(
      this.combatant,
      this.actionNameOption
    );
    if (hasRequiredConsumables) return BehaviorNodeState.Success;

    return BehaviorNodeState.Failure;
  }
}
