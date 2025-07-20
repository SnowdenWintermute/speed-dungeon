import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

class CollectPotentialTargetsForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;

    const { combatantProperties } = this.combatant;
    const actionState = CombatantProperties.getCombatActionPropertiesIfOwned(
      combatantProperties,
      this.actionNameOption
    );

    const action = COMBAT_ACTIONS[this.actionNameOption];
    const { targetingProperties } = action;

    return BehaviorNodeState.Failure;
  }
}
