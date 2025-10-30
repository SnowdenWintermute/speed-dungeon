import { AdventuringParty } from "../../adventuring-party/index.js";
import { COMBAT_ACTIONS, ThreatChanges } from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import { ThreatCalculator } from "../../combatants/threat-manager/threat-calculator.js";
import {
  ActionCompletionUpdateCommand,
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
  GameUpdateCommandType,
} from "../index.js";

const stepType = ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock;
export class EvaluatePlayerEndTurnAndInputLockActionResolutionStep extends ActionResolutionStep {
  branchingActions: ActionIntentAndUser[] = [];
  constructor(context: ActionResolutionStepContext) {
    super(stepType, context, null); // this step should produce no game update unless it is unlocking input
    const { party } = context.actionUserContext;

    const gameUpdateCommandOption = evaluatePlayerEndTurnAndInputLock(context);
    if (gameUpdateCommandOption) {
      this.gameUpdateCommandOption = gameUpdateCommandOption;

      for (const combatant of party.combatantManager.getAllCombatants()) {
        if (!combatant.combatantProperties.threatManager) continue;
        combatant.combatantProperties.threatManager.updateHomeRotationToPointTowardNewTopThreatTarget(
          party,
          combatant
        );
      }
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

  sequentialActionManagerRegistry.decrementInputLockReferenceCount();

  const action = COMBAT_ACTIONS[tracker.actionExecutionIntent.actionName];

  const { game, party, actionUser } = context.actionUserContext;
  const battleOption = AdventuringParty.getBattleOption(party, game);

  const userIsCombatant = actionUser instanceof Combatant;

  const noActionPointsLeft =
    userIsCombatant && actionUser.combatantProperties.resources.getActionPoints() === 0;
  const requiredTurn =
    action.costProperties.requiresCombatTurnInThisContext(context, action) || noActionPointsLeft;

  const turnAlreadyEnded = sequentialActionManagerRegistry.getTurnEnded();

  let shouldSendEndActiveTurnMessage = false;
  const threatChanges = new ThreatChanges();
  if (requiredTurn && !turnAlreadyEnded && battleOption) {
    // if they died on their own turn we should not end the active combatant's turn because
    // we would have already removed their turn tracker on death
    const { actionName } = tracker.actionExecutionIntent;

    battleOption.turnOrderManager.updateFastestSchedulerWithExecutedActionDelay(party, actionName);
    battleOption.turnOrderManager.updateTrackers(game, party);

    sequentialActionManagerRegistry.setTurnEnded();
    shouldSendEndActiveTurnMessage = true;

    actionUser.handleTurnEnded();

    // only decay threat for combatant turns ending
    // not for conditions or action entities
    if (userIsCombatant) {
      const threatCalculator = new ThreatCalculator(
        threatChanges,
        context.tracker.hitOutcomes,
        context.actionUserContext.party,
        context.actionUserContext.actionUser,
        context.tracker.actionExecutionIntent.actionName
      );
      threatCalculator.addVolatileThreatDecay();

      threatChanges.applyToGame(party);
    }
  }

  const hasRemainingActions = tracker.parentActionManager.getRemainingActionsToExecute().length > 0;
  const blockingStepsPending = sequentialActionManagerRegistry.inputBlockingActionStepsArePending();
  const noBlockingActionsRemain = !hasRemainingActions && !blockingStepsPending;

  let shouldUnlockInput = false;

  if (battleOption === null) {
    if (noBlockingActionsRemain) shouldUnlockInput = true;
  } else if (noBlockingActionsRemain) {
    const newlyUpdatedCurrentTurnIsPlayerControlled =
      battleOption.turnOrderManager.currentActorIsPlayerControlled(party);

    if (newlyUpdatedCurrentTurnIsPlayerControlled) shouldUnlockInput = true;
  }
  if (!shouldUnlockInput && !requiredTurn) return;

  // push a game update command to unlock input
  const gameUpdateCommandOption: ActionCompletionUpdateCommand = {
    type: GameUpdateCommandType.ActionCompletion,
    actionName: context.tracker.actionExecutionIntent.actionName,
    step: stepType,
    completionOrderId: null,
  };

  if (!threatChanges.isEmpty()) gameUpdateCommandOption.threatChanges = threatChanges;
  if (shouldSendEndActiveTurnMessage) {
    gameUpdateCommandOption.endActiveCombatantTurn = true;
  } else {
  }
  if (shouldUnlockInput) {
    gameUpdateCommandOption.unlockInput = true;
    party.inputLock.unlockInput();
  }

  return gameUpdateCommandOption;
}
