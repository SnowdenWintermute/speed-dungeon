import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { RollIncomingHitOutcomesActionResolutionStep } from "./roll-incoming-hit-outcomes.js";

const stepType = ActionResolutionStepType.evalOnUseTriggers;
export class EvalOnUseTriggersActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    // counterspells
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

  onComplete(): ActionResolutionStepResult {
    // set any sub actions to the branchingActions list
    const action = COMBAT_ACTIONS[this.context.actionExecutionIntent.actionName];
    const subActions = action.getConcurrentSubActions(this.context.combatantContext);
    const branchingActions = subActions.map((actionExecutionIntent) => {
      return {
        user: this.context.combatantContext.combatant,
        actionExecutionIntent,
      };
    });
    // @TODO - collect all triggered actions and add to branchingActions list
    // @TODO - determine next step based on action type:
    // ex: if countered, skip the rollIncomingHitOutcomes step and go to postUseAnimation with a countered animation
    // and push a GameUpdateCommand with the counter animation for the countering combatant
    //

    return {
      branchingActions, // split arrow, split arrow, split arrow
      // in case of subActions, skip to post use animation
      nextStepOption: new RollIncomingHitOutcomesActionResolutionStep(this.context),
    };
  }
}
