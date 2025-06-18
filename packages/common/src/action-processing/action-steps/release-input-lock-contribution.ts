import { CombatActionExecutionIntent } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
  GameUpdateCommand,
  GameUpdateCommandType,
} from "../index.js";

const stepType = ActionResolutionStepType.ReleaseInputLockContribution;
export class ReleaseInputLockContributionActionResolutionStep extends ActionResolutionStep {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] = [];
  constructor(context: ActionResolutionStepContext) {
    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.InputLock,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
    };
    super(stepType, context, gameUpdateCommand);
    const { tracker } = this.context;
    const { sequentialActionManagerRegistry } = tracker.parentActionManager;
    sequentialActionManagerRegistry.decrementInputLockReferenceCount();

    if (!sequentialActionManagerRegistry.inputBlockingActionStepsArePending()) {
      // push a game update command to unlock input
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
