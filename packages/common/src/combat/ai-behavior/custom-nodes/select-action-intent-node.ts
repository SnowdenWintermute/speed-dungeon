import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";
import { Combatant } from "../../../combatants/index.js";
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

    // @TODO - actually consider higher levels and set this value to something
    const level = this.behaviorContext.currentActionLevelConsidering || 1;

    const actionAndRank = new ActionAndRank(actionNameOption, level);
    const { game, party } = this.behaviorContext.actionUserContext;

    const actionUseIsValidResult = this.combatant.canUseAction(actionAndRank, game, party);
    if (actionUseIsValidResult instanceof Error) throw actionUseIsValidResult;

    this.behaviorContext.selectedActionIntent = new CombatActionExecutionIntent(
      actionNameOption,
      level,
      targetsOption
    );

    const targetingProperties = this.combatant.getTargetingProperties();
    targetingProperties.setSelectedActionAndRank(actionAndRank);
    targetingProperties.setSelectedTarget(targetsOption);

    return BehaviorNodeState.Success;
  }
}
