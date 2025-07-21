import { Combatant } from "../../../combatants/index.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState, SequenceNode } from "../behavior-tree.js";
import { CollectPotentialTargetsForAction } from "./collect-potential-target-for-action.js";

export class CollectPotentialTargetsForActionIfUsable implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
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
