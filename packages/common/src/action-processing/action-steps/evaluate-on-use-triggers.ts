import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { Combatant } from "../../combatants/index.js";
import { ActionTracker } from "../action-tracker.js";

const stepType = ActionResolutionStepType.EvalOnUseTriggers;
export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, tracker: ActionTracker) {
    // counterspells
    // if countered, set the tracker "wasInterrupted" to true
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.ActivatedTriggers,
      step: stepType,
      completionOrderId: null,
    };

    super(stepType, context, gameUpdateCommand);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    // @TODO - collect all triggered actions and add to branchingActions list
    // if not "countered", set any concurrent sub actions to the branchingActions list
    const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];
    const subActions = action.getConcurrentSubActions(this.context.combatantContext);
    const branchingActions = subActions.map((actionExecutionIntent) => {
      return {
        user: this.context.combatantContext.combatant,
        actionExecutionIntent,
      };
    });
    return branchingActions;
  }
}
