import {
  ActionPayableResource,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
} from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
  GameUpdateCommandType,
} from "../index.js";
import { evaluatePlayerEndTurnAndInputLock } from "./evaluate-player-turn-end-and-input-lock.js";

const stepType = ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock;
export class DetermineShouldExecuteOrReleaseTurnLockActionResolutionStep extends ActionResolutionStep {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] = [];
  constructor(context: ActionResolutionStepContext) {
    super(stepType, context, null); // this step should produce no game update

    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const turnAlreadyEnded =
      context.tracker.parentActionManager.sequentialActionManagerRegistry.getTurnEnded();

    const resourceCosts = action.costProperties.getResourceCosts(
      context.combatantContext.combatant.combatantProperties,
      !!context.combatantContext.getBattleOption(),
      context.tracker.actionExecutionIntent.level
    );

    const actionPointCost = resourceCosts?.[ActionPayableResource.ActionPoints] || 0;

    const actionShouldExecuteEvenIfTurnEnded = turnAlreadyEnded && Math.abs(actionPointCost) < 1;

    const shouldExecute =
      action.targetingProperties.shouldExecute(
        context.combatantContext,
        context.tracker.getPreviousTrackerInSequenceOption() || undefined,
        action
      ) &&
      (!turnAlreadyEnded || actionShouldExecuteEvenIfTurnEnded);

    if (shouldExecute) return;

    context.tracker.wasAborted = true;

    const gameUpdateCommandOption = evaluatePlayerEndTurnAndInputLock(context);
    if (gameUpdateCommandOption) {
      this.gameUpdateCommandOption = {
        type: GameUpdateCommandType.ActionCompletion,
        actionName: context.tracker.actionExecutionIntent.actionName,
        step: stepType,
        completionOrderId: null,
        ...gameUpdateCommandOption,
      };
    }

    // set a timeout to unlock input equal to current action accumulated time
    // plus all previous actions accumulated time in the current
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    const toReturn = this.branchingActions;
    return toReturn;
  }
}
