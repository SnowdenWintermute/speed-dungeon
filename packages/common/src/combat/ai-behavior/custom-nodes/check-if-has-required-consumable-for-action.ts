import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "../../combat-actions/index.js";
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
    const { combatantProperties } = this.combatant;

    const hasRequiredConsumables = CombatantProperties.hasRequiredConsumablesToUseAction(
      combatantProperties,
      this.actionNameOption
    );
    if (hasRequiredConsumables) return BehaviorNodeState.Success;
    console.log(COMBAT_ACTION_NAME_STRINGS[this.actionNameOption], "missing consumable");
    return BehaviorNodeState.Failure;
  }
}
