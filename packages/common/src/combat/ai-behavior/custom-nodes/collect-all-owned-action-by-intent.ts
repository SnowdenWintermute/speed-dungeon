import { Combatant } from "../../../combatants/index.js";
import { iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionIntent, CombatActionName } from "../../combat-actions/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class CollectAllOwnedActionsByIntent implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionIntents: CombatActionIntent[]
  ) {}
  execute(): BehaviorNodeState {
    const { ownedActions } = this.combatant.combatantProperties;
    const collected: CombatActionName[] = [];
    for (const [actionName, _actionState] of iterateNumericEnumKeyedRecord(ownedActions)) {
      const action = COMBAT_ACTIONS[actionName];
      if (this.actionIntents.includes(action.targetingProperties.intent))
        collected.push(actionName);
    }
    if (collected.length === 0) return BehaviorNodeState.Failure;

    this.behaviorContext.consideredActionNamesFilteredByIntents = collected;

    return BehaviorNodeState.Success;
  }
}
