import { Combatant } from "../../../combatants/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionName } from "../../combat-actions/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class CheckIfHasRequiredResourcesForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;
    const { combatantProperties } = this.combatant;

    const costs = COMBAT_ACTIONS[this.actionNameOption].costProperties.getResourceCosts(
      this.combatant,
      true,
      // @TODO - actually select an action level
      1
    );
    const hasRequiredResources =
      !this.combatant.combatantProperties.resources.getUnmetCostResourceTypes(costs).length;

    if (hasRequiredResources) return BehaviorNodeState.Success;

    return BehaviorNodeState.Failure;
  }
}
