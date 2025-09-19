import { AdventuringParty, InputLock } from "../../adventuring-party/index.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  ThreatChanges,
} from "../../combat/index.js";
import { Combatant, CombatantCondition, CombatantProperties } from "../../combatants/index.js";
import { ThreatCalculator } from "../../combatants/threat-manager/threat-calculator.js";
import {
  ActionCompletionUpdateCommand,
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
    const { party } = context.combatantContext;

    const gameUpdateCommandOption = evaluatePlayerEndTurnAndInputLock(context);
    if (gameUpdateCommandOption) {
      this.gameUpdateCommandOption = gameUpdateCommandOption;

      for (const [groupName, combatantGroup] of Object.entries(
        AdventuringParty.getAllCombatants(party)
      )) {
        for (const [entityId, combatant] of Object.entries(combatantGroup)) {
          if (!combatant.combatantProperties.threatManager) continue;
          combatant.combatantProperties.threatManager.updateHomeRotationToPointTowardNewTopThreatTarget(
            party,
            combatant
          );
        }
      }
    }

    // @TODO
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

export function evaluatePlayerEndTurnAndInputLock(context: ActionResolutionStepContext) {
  const { tracker } = context;
  const { sequentialActionManagerRegistry } = tracker.parentActionManager;

  sequentialActionManagerRegistry.decrementInputLockReferenceCount();

  const action = COMBAT_ACTIONS[tracker.actionExecutionIntent.actionName];
  const actionNameString = COMBAT_ACTION_NAME_STRINGS[tracker.actionExecutionIntent.actionName];

  const { game, party, combatant } = context.combatantContext;
  const battleOption = AdventuringParty.getBattleOption(party, game);

  const { asShimmedUserOfTriggeredCondition } = combatant.combatantProperties;

  // unlock input if no more blocking steps are left and next turn is player
  const noActionPointsLeft =
    combatant.combatantProperties.actionPoints === 0 &&
    // this is because it was ending our turn when conditions used actions in between mh and oh attacks since the shimmed condition users don't have any action points
    combatant.combatantProperties.asShimmedUserOfTriggeredCondition === undefined;
  const requiredTurn =
    action.costProperties.requiresCombatTurnInThisContext(context, action) || noActionPointsLeft;

  const turnAlreadyEnded = sequentialActionManagerRegistry.getTurnEnded();

  let shouldSendEndActiveTurnMessage = false;
  const threatChanges = new ThreatChanges();
  if (requiredTurn && !turnAlreadyEnded && battleOption) {
    // if they died on their own turn we should not end the active combatant's turn because
    // we would have already removed their turn tracker on death
    const { actionName } = tracker.actionExecutionIntent;

    battleOption.turnOrderManager.updateSchedulerWithExecutedActionDelay(party, actionName);
    battleOption.turnOrderManager.updateTrackers(game, party);

    sequentialActionManagerRegistry.setTurnEnded();
    shouldSendEndActiveTurnMessage = true;

    // REFILL THE QUICK ACTIONS OF THE CURRENT TURN
    // this way, if we want to remove their quick actions they can be at risk
    // of actions taking them away before they get their turn again
    CombatantProperties.refillActionPoints(combatant.combatantProperties);
    CombatantProperties.tickCooldowns(combatant.combatantProperties);

    // don't decay threat for every ticking condition
    if (!asShimmedUserOfTriggeredCondition) {
      const threatCalculator = new ThreatCalculator(
        threatChanges,
        context.tracker.hitOutcomes,
        context.combatantContext.party,
        context.combatantContext.combatant,
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
    InputLock.unlockInput(party.inputLock);
  }

  return gameUpdateCommandOption;
}
