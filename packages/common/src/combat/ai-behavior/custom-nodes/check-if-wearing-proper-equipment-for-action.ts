import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";
import { Combatant } from "../../../combatants/index.js";
import { CombatActionName } from "../../combat-actions/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class CheckIfWearingProperEquipmentForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName,
    private actionLevelOption: null | number
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;
    const { combatantProperties } = this.combatant;

    if (this.actionLevelOption === null) return BehaviorNodeState.Failure;

    const isWearingProperEquipment =
      combatantProperties.equipment.isWearingRequiredEquipmentToUseAction(
        new ActionAndRank(this.actionNameOption, this.actionLevelOption)
      );
    if (isWearingProperEquipment) return BehaviorNodeState.Success;
    return BehaviorNodeState.Failure;
  }
}
