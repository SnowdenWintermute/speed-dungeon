import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";
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
      this.combatant,
      // @TODO - actually select an action level
      new ActionAndRank(this.actionNameOption, 1),
      true
    );
    if (hasResources) return BehaviorNodeState.Success;

    return BehaviorNodeState.Failure;
  }
}
