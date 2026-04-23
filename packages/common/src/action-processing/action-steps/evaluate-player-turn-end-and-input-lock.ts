import { EntityId } from "../../aliases.js";
import { ThreatChanges } from "../../combat/action-results/action-hit-outcome-calculation/resource-changes.js";
import { COMBAT_ACTIONS } from "../../combat/combat-actions/action-implementations/index.js";
import { Combatant } from "../../combatants/index.js";
import { ThreatCalculator } from "../../combatants/threat-manager/threat-calculator.js";
import { ActionCompletionUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";

const stepType = ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock;
export class EvaluatePlayerEndTurnAndInputLockActionResolutionStep extends ActionResolutionStep {
  branchingActions: ActionIntentAndUser[] = [];
  constructor(context: ActionResolutionStepContext) {
    super(stepType, context, null); // this step should produce no game update unless it is unlocking input
    const { game, party } = context.actionUserContext;

    const gameUpdateCommandOption = evaluatePlayerEndTurnAndInputLock(context);
    if (gameUpdateCommandOption) {
      this.gameUpdateCommandOption = gameUpdateCommandOption;
      party.combatantManager.updateHomePositionsToPointAtTopThreat();
    }

    // @TODO
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

export function evaluatePlayerEndTurnAndInputLock(context: ActionResolutionStepContext) {
  const { tracker } = context;
  const { sequentialActionManagerRegistry } = tracker.parentActionManager;
  const { game, party, actionUser } = context.actionUserContext;
  const battleOption = party.getBattleOption(game);
  const userIsCombatant = actionUser instanceof Combatant;
  const noActionPointsLeft =
    userIsCombatant && actionUser.combatantProperties.resources.getActionPoints() === 0;
  const action = COMBAT_ACTIONS[tracker.actionExecutionIntent.actionName];
  const requiresTurnInThisContext = action.costProperties.requiresCombatTurnInThisContext(
    context,
    action
  );
  const requiredTurn = requiresTurnInThisContext || noActionPointsLeft;
  const turnAlreadyEnded = sequentialActionManagerRegistry.getTurnEnded();
  const shouldEndTurn = requiredTurn && !turnAlreadyEnded && battleOption;

  // FOR SERVER
  sequentialActionManagerRegistry.decrementInputLockReferenceCount();
  // FOR BOTH
  let tellClientDelayAdded: { delay: number; schedulerId: EntityId } | undefined = undefined;

  // only decay threat for combatant turns ending
  // not for conditions or action entities
  const threatChanges = new ThreatChanges();
  if (actionUser instanceof Combatant) {
    const threatCalculator = new ThreatCalculator(
      threatChanges,
      context.tracker.hitOutcomes,
      context.actionUserContext.party,
      actionUser,
      context.tracker.actionExecutionIntent.actionName
    );
    threatCalculator.addVolatileThreatDecay();
  }

  if (shouldEndTurn) {
    const { actionName } = tracker.actionExecutionIntent;
    const delay = actionUser.getDelayForActionUse(actionName);
    tellClientDelayAdded = { schedulerId: actionUser.getEntityId(), delay };
    battleOption.handleTurnEnded(actionUser, delay, threatChanges);
    sequentialActionManagerRegistry.setTurnEnded();
  }

  const hasRemainingActions = tracker.parentActionManager.getRemainingActionsToExecute().length > 0;
  const blockingStepsPending = sequentialActionManagerRegistry.inputBlockingActionStepsArePending();
  const noBlockingActionsRemain = !hasRemainingActions && !blockingStepsPending;

  let shouldUnlockInput = false;

  if (battleOption === null) {
    if (noBlockingActionsRemain) {
      shouldUnlockInput = true;
    }
  } else if (noBlockingActionsRemain) {
    const newlyUpdatedCurrentTurnIsPlayerControlled =
      battleOption.turnOrderManager.currentActorIsPlayerControlled(party);

    if (newlyUpdatedCurrentTurnIsPlayerControlled) {
      shouldUnlockInput = true;
    }
  }

  if (!shouldUnlockInput && !requiredTurn) {
    return;
  }

  // push a game update command to unlock input
  const gameUpdateCommandOption: ActionCompletionUpdateCommand = {
    type: GameUpdateCommandType.ActionCompletion,
    actionName: context.tracker.actionExecutionIntent.actionName,
    step: stepType,
    completionOrderId: null,
  };

  if (!threatChanges.isEmpty()) {
    gameUpdateCommandOption.threatChanges = threatChanges;
  }

  if (tellClientDelayAdded) {
    gameUpdateCommandOption.addDelayToTurnScheduler = tellClientDelayAdded;
  }

  if (shouldUnlockInput) {
    gameUpdateCommandOption.unlockInput = true;
    sequentialActionManagerRegistry.durationSpentInInputLock =
      context.manager.sequentialActionManagerRegistry.time.ms;
    console.log(
      "shouldUnlockInput, ticked duration",
      sequentialActionManagerRegistry.durationSpentInInputLock
    );
  }

  return gameUpdateCommandOption;
}
