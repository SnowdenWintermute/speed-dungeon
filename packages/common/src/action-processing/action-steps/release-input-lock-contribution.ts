import { CombatActionExecutionIntent } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
  GameUpdateCommandType,
  InputLockUpdateCommand,
} from "../index.js";

const stepType = ActionResolutionStepType.ReleaseInputLockContribution;
export class ReleaseInputLockContributionActionResolutionStep extends ActionResolutionStep {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] = [];
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: InputLockUpdateCommand = {
      type: GameUpdateCommandType.InputLock,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
      isLocked: true,
    };
    super(stepType, context, gameUpdateCommand);
    const { tracker } = this.context;
    const { sequentialActionManagerRegistry } = tracker.parentActionManager;
    sequentialActionManagerRegistry.decrementInputLockReferenceCount();

    // unlock input if:
    // if no more blocking steps are left and next turn is player
    if (!sequentialActionManagerRegistry.inputBlockingActionStepsArePending()) {
      // push a game update command to unlock input
      // set a timeout to unlock input equal to current action accumulated time
      // plus all previous actions accumulated time in the current
      gameUpdateCommand.isLocked = false;
    }
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
