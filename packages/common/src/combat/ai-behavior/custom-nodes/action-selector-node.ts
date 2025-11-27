import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";
import { Combatant } from "../../../combatants/index.js";
import { AiActionComparator, AiActionSelector } from "../ai-action-selector/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class ActionSelectorNode implements BehaviorNode {
  private actionSelector: AiActionSelector;
  constructor(
    private behaviorContext: AIBehaviorContext,
    private possibleTargetFilter: (combatant: Combatant) => boolean,
    private actionIntentComparator?: AiActionComparator
  ) {
    this.actionSelector = new AiActionSelector(behaviorContext.actionUserContext);
  }

  execute(): BehaviorNodeState {
    const actionIntentOption = this.actionSelector.getBestActionIntentOption(
      this.possibleTargetFilter,
      this.actionIntentComparator
    );
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
