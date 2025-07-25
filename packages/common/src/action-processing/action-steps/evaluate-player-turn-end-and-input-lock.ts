import { AdventuringParty, InputLock } from "../../adventuring-party/index.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
} from "../../combat/index.js";
import {
  Combatant,
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantCondition,
  CombatantProperties,
} from "../../combatants/index.js";
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

    const gameUpdateCommandOption = evaluatePlayerEndTurnAndInputLock(context);
    if (gameUpdateCommandOption) this.gameUpdateCommandOption = gameUpdateCommandOption;

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

  // handle conditions using actions, which should remove their stacks

  const { asShimmedUserOfTriggeredCondition } = combatant.combatantProperties;
  if (asShimmedUserOfTriggeredCondition) {
    const { condition } = asShimmedUserOfTriggeredCondition;

    const tickPropertiesOption = CombatantCondition.getTickProperties(condition);
    if (tickPropertiesOption) {
      const { numStacksRemoved } = tickPropertiesOption.onTick(condition, context.combatantContext);
    }
  }

  // unlock input if no more blocking steps are left and next turn is player

  const requiredTurn = action.costProperties.requiresCombatTurn(context);
  const turnAlreadyEnded = sequentialActionManagerRegistry.getTurnEnded();
  let shouldSendEndActiveTurnMessage = false;
  if (requiredTurn && !turnAlreadyEnded && battleOption) {
    // if they died on their own turn we should not end the active combatant's turn because
    // we would have already removed their turn tracker on death
    const { actionName } = tracker.actionExecutionIntent;

    battleOption.turnOrderManager.updateSchedulerWithExecutedActionDelay(party, actionName);
    battleOption.turnOrderManager.updateTrackers(game, party);

    sequentialActionManagerRegistry.markTurnEnded();
    shouldSendEndActiveTurnMessage = true;
  }

  const hasUnevaluatedChildren = action.getChildren(context).length > 0;
  const hasRemainingActions = tracker.parentActionManager.getRemainingActionsToExecute().length > 0;
  const blockingStepsPending = sequentialActionManagerRegistry.inputBlockingActionStepsArePending();
  const noBlockingActionsRemain =
    !hasUnevaluatedChildren && !hasRemainingActions && !blockingStepsPending;

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

  if (shouldSendEndActiveTurnMessage) gameUpdateCommandOption.endActiveCombatantTurn = true;

  if (shouldUnlockInput) {
    gameUpdateCommandOption.unlockInput = true;
    InputLock.unlockInput(party.inputLock);
  }

  return gameUpdateCommandOption;
}
