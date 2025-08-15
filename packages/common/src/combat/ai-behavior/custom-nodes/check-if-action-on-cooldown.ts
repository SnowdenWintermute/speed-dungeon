import { Combatant } from "../../../combatants/index.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class CheckIfActionOnCooldown implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;
    const { combatantProperties } = this.combatant;

    const actionStateOption =
      combatantProperties.abilityProperties.ownedActions[this.actionNameOption];
    if (!this.actionNameOption) return BehaviorNodeState.Failure;

    if (!actionStateOption?.cooldown?.current) return BehaviorNodeState.Success;

    return BehaviorNodeState.Failure;
  }
}
