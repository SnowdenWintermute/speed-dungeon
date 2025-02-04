import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepResult,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { EvalOnHitOutcomeTriggersActionResolutionStep } from "./evaluate-hit-outcome-triggers.js";

export class RollIncomingHitOutcomesActionResolutionStep extends ActionResolutionStep {
  constructor(private context: ActionResolutionStepContext) {
    // @TODO - calculate hits, evades, parries, blocks, hp/mp/shard/durability changes to apply
    // and pass them to the next step for triggers and filtering
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.HitOutcomes,
      completionOrderId: null,
      actionName: context.actionExecutionIntent.actionName,
      // hits, misses, evades, parries, blocks
    };
    super(ActionResolutionStepType.payResourceCosts, gameUpdateCommand, context);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  onComplete(): ActionResolutionStepResult {
    return {
      branchingActions: [],
      nextStepOption: new EvalOnHitOutcomeTriggersActionResolutionStep(this.context),
    };
  }
}
