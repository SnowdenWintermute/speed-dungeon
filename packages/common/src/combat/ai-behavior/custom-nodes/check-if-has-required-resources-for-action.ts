import { Combatant, CombatantProperties } from "../../../combatants/index.js";
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

    const hasResources = CombatantProperties.hasRequiredResourcesToUseAction(
      combatantProperties,
      this.actionNameOption,
      true,
      1 // @TODO - actually select an action level
    );
    if (hasResources) return BehaviorNodeState.Success;

    console.log("missing resources required");
    return BehaviorNodeState.Failure;
  }
}
