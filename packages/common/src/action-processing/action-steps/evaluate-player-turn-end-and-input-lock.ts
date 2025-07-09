import { AdventuringParty, InputLock } from "../../adventuring-party/index.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
} from "../../combat/index.js";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
  GameUpdateCommandType,
} from "../index.js";

const stepType = ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock;
export class EvaluatePlayerEndTurnAndInputLockActionResolutionStep extends ActionResolutionStep {
  branchingActions: { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] = [];
  constructor(context: ActionResolutionStepContext) {
    super(stepType, context, null); // this step should produce no game update unless it is unlocking input
    const { tracker } = this.context;
    const { sequentialActionManagerRegistry } = tracker.parentActionManager;
    sequentialActionManagerRegistry.decrementInputLockReferenceCount();

    const action = COMBAT_ACTIONS[tracker.actionExecutionIntent.actionName];
    const actionName = COMBAT_ACTION_NAME_STRINGS[tracker.actionExecutionIntent.actionName];

    const childrenCount = action.getChildren(context).length;
    if (childrenCount > 0) {
      // don't unlock, we need to consider child actions
      return;
    }

    if (tracker.parentActionManager.getRemainingActionsToExecute().length > 0) {
      return;
    }

    // unlock input if no more blocking steps are left and next turn is player
    if (sequentialActionManagerRegistry.inputBlockingActionStepsArePending()) {
      console.log(actionName, "has pending blocking steps");
      return;
    }

    const { game, party } = context.combatantContext;
    const battleOption = AdventuringParty.getBattleOption(party, game);

    let shouldUnlockInput = false;

    if (battleOption === null) {
      console.log(actionName, "unlocking input since no battle");
      shouldUnlockInput = true;
    } else {
      const nextTurnWillBePlayerControlled =
        battleOption.turnOrderManager.predictedNextActorTurnTrackerIsPlayerControlled(
          party,
          this.context.tracker.actionExecutionIntent.actionName
        );

      console.log(
        actionName,
        "predictedNextActorTurnTrackerIsPlayerControlled",
        nextTurnWillBePlayerControlled
      );
      if (nextTurnWillBePlayerControlled) shouldUnlockInput = true;
    }

    const requiredTurn = action.costProperties.requiresCombatTurn(tracker.currentStep.getContext());

    if (!shouldUnlockInput && !requiredTurn) return;

    // push a game update command to unlock input
    this.gameUpdateCommandOption = {
      type: GameUpdateCommandType.ActionCompletion,
      actionName: context.tracker.actionExecutionIntent.actionName,
      step: stepType,
      completionOrderId: null,
    };

    if (shouldUnlockInput) {
      console.log(actionName, "shouldUnlockInput");
      this.gameUpdateCommandOption.unlockInput = true;
      InputLock.unlockInput(party.inputLock);
    }

    const turnAlreadyEnded = sequentialActionManagerRegistry.getTurnEnded();
    if (requiredTurn && !turnAlreadyEnded && battleOption) {
      // if they died on their own turn we should not end the active combatant's turn because
      // we would have already removed their turn tracker on death
      const { combatantContext } = context;
      !CombatantProperties.isDead(combatantContext.combatant.combatantProperties);
      {
        const { actionName } = tracker.actionExecutionIntent;

        battleOption.turnOrderManager.updateSchedulerWithExecutedActionDelay(party, actionName);
        battleOption.turnOrderManager.updateTrackers(party);
      }

      sequentialActionManagerRegistry.markTurnEnded();

      this.gameUpdateCommandOption.endActiveCombatantTurn = true;
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
