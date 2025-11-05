import { ActionPayableResource, COMBAT_ACTIONS } from "../../combat/index.js";
import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "../index.js";
import { evaluatePlayerEndTurnAndInputLock } from "./evaluate-player-turn-end-and-input-lock.js";

export class DetermineShouldExecuteOrReleaseTurnLockActionResolutionStep extends ActionResolutionStep {
  branchingActions: ActionIntentAndUser[] = [];
  constructor(context: ActionResolutionStepContext, stepType: ActionResolutionStepType) {
    super(stepType, context, null); // this step should produce no game update

    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const turnAlreadyEnded =
      context.tracker.parentActionManager.sequentialActionManagerRegistry.getTurnEnded();

    const { actionUser, party } = context.actionUserContext;

    const resourceCosts = action.costProperties.getResourceCosts(
      actionUser,
      party.isInCombat(),
      context.tracker.actionExecutionIntent.rank
    );

    const actionPointCost = resourceCosts?.[ActionPayableResource.ActionPoints] || 0;

    const actionShouldExecuteEvenIfTurnEnded = turnAlreadyEnded && Math.abs(actionPointCost) < 1;

    const executionPreconditionsPassed = action.shouldExecute(
      context,
      context.tracker.getPreviousTrackerInSequenceOption() || undefined
    );

    const shouldExecute =
      executionPreconditionsPassed && (!turnAlreadyEnded || actionShouldExecuteEvenIfTurnEnded);

    if (shouldExecute) return;

    context.tracker.wasAborted = true;

    const gameUpdateCommandOption = evaluatePlayerEndTurnAndInputLock(context);
    if (gameUpdateCommandOption) this.gameUpdateCommandOption = gameUpdateCommandOption;

    // set a timeout to unlock input equal to current action accumulated time
    // plus all previous actions accumulated time in the current
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  getBranchingActions(): Error | ActionIntentAndUser[] {
    const toReturn = this.branchingActions;
    return toReturn;
  }
}
