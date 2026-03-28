import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";
import { Combatant } from "../../../combatants/index.js";
import { COMBAT_ACTION_NAME_STRINGS } from "../../combat-actions/combat-action-names.js";
import { AiActionSelector, AiActionEvaluator } from "../ai-action-selector/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";
import { AI_BEHAVIOR_TYPE_STRINGS, AiType } from "../index.js";

export class ActionSelectorNode implements BehaviorNode {
  private actionSelector: AiActionSelector;
  constructor(
    private behaviorContext: AIBehaviorContext,
    private aiType: AiType,
    private possibleTargetFilters: ((combatant: Combatant) => boolean)[],
    private actionIntentEvaluator: AiActionEvaluator
  ) {
    this.actionSelector = new AiActionSelector(behaviorContext.actionUserContext);
  }

  execute(): BehaviorNodeState {
    const actionIntentOption = this.actionSelector.getBestActionIntentOption(
      this.possibleTargetFilters,
      this.actionIntentEvaluator
    );
    const actionNameSelected = actionIntentOption?.actionName;

    if (actionIntentOption === null) {
      return BehaviorNodeState.Failure;
    } else {
      this.behaviorContext.selectedActionIntent = actionIntentOption;
      const { actionUser } = this.behaviorContext.actionUserContext;

      const targetingProperties = actionUser.getTargetingProperties();
      const { actionName, rank, targets } = actionIntentOption;
      targetingProperties.setSelectedActionAndRank(new ActionAndRank(actionName, rank));
      targetingProperties.setSelectedTarget(targets);

      return BehaviorNodeState.Success;
    }
  }
}
