import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";
import { Combatant } from "../../../combatants/index.js";
import { AiActionSelector, AiActionEvaluator } from "../ai-action-selector/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";
import { AiType } from "../index.js";

export class ActionSelectorNode implements BehaviorNode {
  private actionSelector: AiActionSelector;
  constructor(
    private behaviorContext: AIBehaviorContext,
    private aiType: AiType,
    private possibleTargetFilters: ((combatant: Combatant) => boolean)[],
    private actionIntentEvaluator: AiActionEvaluator
  ) {
    this.actionSelector = new AiActionSelector(behaviorContext);
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
