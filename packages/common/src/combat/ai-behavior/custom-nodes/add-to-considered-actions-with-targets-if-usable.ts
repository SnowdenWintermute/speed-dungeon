import { Combatant } from "../../../combatants/index.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState, SequenceNode } from "../behavior-tree.js";
import { CheckIfActionUsableInCurrentContext } from "./check-if-action-usable-in-current-context.js";
import { CheckIfHasRequiredConsumablesForAction } from "./check-if-has-required-consumable-for-action.js";
import { CheckIfHasRequiredResourcesForAction } from "./check-if-has-required-resources-for-action.js";
import { CheckIfWearingProperEquipmentForAction } from "./check-if-wearing-proper-equipment-for-action.js";
import { CollectPotentialTargetsForAction } from "./collect-potential-target-for-action.js";

export class CollectPotentialTargetsForActionIfUsable implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant
  ) {}
  private root = new SequenceNode([
    // check if action is useable
    new CheckIfActionUsableInCurrentContext(
      this.behaviorContext,
      this.combatant,
      this.actionNameOption
    ),
    new CheckIfHasRequiredResourcesForAction(
      this.behaviorContext,
      this.combatant,
      this.actionNameOption
    ),
    new CheckIfHasRequiredConsumablesForAction(
      this.behaviorContext,
      this.combatant,
      this.actionNameOption
    ),
    new CheckIfWearingProperEquipmentForAction(
      this.behaviorContext,
      this.combatant,
      this.actionNameOption
    ),
    new CollectPotentialTargetsForAction(
      this.behaviorContext,
      this.combatant,
      this.actionNameOption
    ),
  ]);

  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}
