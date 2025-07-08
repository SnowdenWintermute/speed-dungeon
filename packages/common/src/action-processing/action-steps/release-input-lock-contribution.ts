import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatActionExecutionIntent } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
  GameUpdateCommandType,
} from "../index.js";

const stepType = ActionResolutionStepType.ReleaseInputLockContribution;
export class ReleaseInputLockContributionActionResolutionStep extends ActionResolutionStep {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] = [];
  constructor(context: ActionResolutionStepContext) {
    super(stepType, context, null); // this step should produce no game update unless it is unlocking input
    const { tracker } = this.context;
    const { sequentialActionManagerRegistry } = tracker.parentActionManager;
    sequentialActionManagerRegistry.decrementInputLockReferenceCount();

    // unlock input if no more blocking steps are left and next turn is player
    if (sequentialActionManagerRegistry.inputBlockingActionStepsArePending()) return;

    const { game, party } = context.combatantContext;
    const battleOption = AdventuringParty.getBattleOption(party, game);

    let shouldUnlockInput = false;

    if (battleOption === null) shouldUnlockInput = true;
    else {
      const nextTurnWillBePlayerControlled =
        battleOption.turnOrderManager.predictedNextActorTurnTrackerIsPlayerControlled(
          party,
          this.context.tracker.actionExecutionIntent.actionName
        );
      if (nextTurnWillBePlayerControlled) shouldUnlockInput = true;
    }

    if (!shouldUnlockInput) return;

    console.log("should unlock input");

    // push a game update command to unlock input
    this.gameUpdateCommandOption = {
      type: GameUpdateCommandType.InputLock,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
      isLocked: false,
    };

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
