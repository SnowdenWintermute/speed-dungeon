import { Combatant } from "../../../combatants/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionExecutionIntent } from "../../combat-actions/combat-action-execution-intent.js";
import { CombatActionTarget } from "../../targeting/combat-action-targets.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class SelectActionExecutionIntent implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private targetsOptionGetter: () => undefined | CombatActionTarget
  ) {}

  execute(): BehaviorNodeState {
    const actionNameOption = this.behaviorContext.currentActionNameConsidering;
    const targetsOption = this.targetsOptionGetter();
    if (actionNameOption === null || targetsOption === undefined) return BehaviorNodeState.Failure;

    const action = COMBAT_ACTIONS[actionNameOption];
    const actionUseIsValidResult = action.useIsValid(
      targetsOption,
      this.behaviorContext.combatantContext
    );
    if (actionUseIsValidResult instanceof Error) throw actionUseIsValidResult;

    this.behaviorContext.selectedActionIntent = new CombatActionExecutionIntent(
      actionNameOption,
      targetsOption
    );
    this.combatant.combatantProperties.selectedCombatAction = actionNameOption;
    this.combatant.combatantProperties.combatActionTarget = targetsOption;

    return BehaviorNodeState.Success;
  }
}
