import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import {
  ActivatedTriggersGameUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { Combatant, CombatantCondition } from "../../combatants/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
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

    const { combatantContext } = context;
    const { party, combatant } = combatantContext;

    // action was used by a condition, remove stacks and send removed stacks update
    if (combatant.combatantProperties.asShimmedUserOfTriggeredCondition) {
      const { condition } = combatant.combatantProperties.asShimmedUserOfTriggeredCondition;
      const tickPropertiesOption = CombatantCondition.getTickProperties(condition);
      if (tickPropertiesOption) {
        const onTick = tickPropertiesOption.onTick(condition, context.combatantContext);
        const { numStacksRemoved } = onTick;
        const { entityConditionWasAppliedTo } =
          combatant.combatantProperties.asShimmedUserOfTriggeredCondition;
        const hostEntity = AdventuringParty.getCombatant(party, entityConditionWasAppliedTo);
        if (hostEntity instanceof Error) throw hostEntity;

        CombatantCondition.removeStacks(
          condition.id,
          hostEntity.combatantProperties,
          numStacksRemoved
        );

        addRemovedConditionStacksToUpdate(
          condition.id,
          numStacksRemoved,
          gameUpdateCommand,
          hostEntity.entityProperties.id
        );
      }
    }
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    const branchingActions: {
      user: Combatant;
      actionExecutionIntent: CombatActionExecutionIntent;
    }[] = [];
    return branchingActions;
  }
}
