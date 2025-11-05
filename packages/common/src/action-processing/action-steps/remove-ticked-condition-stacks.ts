import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import {
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { Combatant } from "../../combatants/index.js";
import { addRemovedConditionStacksToUpdate } from "./hit-outcome-triggers/add-triggered-condition-to-update.js";

// Made this its own step because conditions were being removed by ticking, then the end turn step
// was trying to sort their turn order tracker but it couldn't get their speed since they no longer
// existed
const stepType = ActionResolutionStepType.RemoveTickedConditionStacks;
export class RemoveTickedConditionStacksActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: ActivatedTriggersGameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
    };

    super(stepType, context, gameUpdateCommand);

    const { actionUserContext } = context;
    const { party, actionUser } = actionUserContext;

    // action was used by a condition, remove stacks and send removed stacks update
    const condition = actionUser;

    const tickPropertiesOption = actionUser.getConditionTickPropertiesOption();

    if (tickPropertiesOption) {
      const onTick = tickPropertiesOption.onTick(context.actionUserContext);
      const { numStacksRemoved } = onTick;
      const entityConditionWasAppliedTo = condition.getConditionAppliedTo();
      const hostEntity = party.combatantManager.getExpectedCombatant(entityConditionWasAppliedTo);

      const { conditionManager } = hostEntity.combatantProperties;
      conditionManager.removeStacks(condition.getEntityId(), numStacksRemoved);

      addRemovedConditionStacksToUpdate(
        condition.getEntityId(),
        numStacksRemoved,
        gameUpdateCommand,
        hostEntity.entityProperties.id
      );
    }
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions(): Error | ActionIntentAndUser[] {
    const branchingActions: {
      user: Combatant;
      actionExecutionIntent: CombatActionExecutionIntent;
    }[] = [];
    return branchingActions;
  }
}
