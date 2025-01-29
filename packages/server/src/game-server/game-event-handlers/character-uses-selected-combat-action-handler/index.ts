import {
  ActionExecutionTracker,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  CombatantAssociatedData,
  ERROR_MESSAGES,
  InputLock,
  ReplayEventNode,
  TICK_LENGTH,
} from "@speed-dungeon/common";
import { validateCombatActionUse } from "../combat-action-results-processing/validate-combat-action-use.js";
import { getGameServer } from "../../../singletons.js";
import { Milliseconds } from "@speed-dungeon/common";

export default async function useSelectedCombatActionHandler(
  _eventData: { characterId: string },
  characterAssociatedData: CharacterAssociatedData
) {
  // ON RECEIPT
  // validate use

  const { game, party, character } = characterAssociatedData;
  const combatantContext: CombatantAssociatedData = { game, party, combatant: character };
  const gameServer = getGameServer();

  if (InputLock.isLocked(party.inputLock)) return new Error(ERROR_MESSAGES.PARTY.INPUT_IS_LOCKED);

  const { selectedCombatAction } = character.combatantProperties;
  if (selectedCombatAction === null) return new Error(ERROR_MESSAGES.COMBATANT.NO_ACTION_SELECTED);

  const action = COMBAT_ACTIONS[selectedCombatAction];

  const targetsAndBattleResult = validateCombatActionUse(
    characterAssociatedData,
    selectedCombatAction
  );

  let sequenceStarted = false;
  let nextResolutionOrderId = 0;
  let nextActionExecutionTrackerId = 0;
  const actionsExecuting: { [id: string]: ActionExecutionTracker } = {};
  const time: { ms: Milliseconds } = { ms: 0 };

  const depthFirstChildrenInExecutionOrder = action
    .getChildrenRecursive(combatantContext.combatant)
    .reverse();

  const replayEventTree = new ReplayEventNode();

  let currentParentActionTracker: null | ActionExecutionTracker = null;

  while (Object.values(actionsExecuting).length || !sequenceStarted) {
    if (!sequenceStarted) sequenceStarted = true;

    // get the next parent action in sequence if haven't yet or one remains to be processed
    if (depthFirstChildrenInExecutionOrder.length && currentParentActionTracker === null) {
      const nextActionToAttemptExecution = depthFirstChildrenInExecutionOrder.pop()!;

      const replayNode = new ReplayEventNode();
      replayEventTree.children.push(replayNode);

      const actionExecutionTrackerId = nextActionExecutionTrackerId++;

      currentParentActionTracker = new ActionExecutionTracker(
        String(actionExecutionTrackerId),
        nextActionToAttemptExecution,
        time.ms,
        combatantContext,
        replayNode
      );

      actionsExecuting[actionExecutionTrackerId] = currentParentActionTracker;
    }

    // @TODO - get ms of the tracker with step nearest to completion
    const tickMs = 10;

    // process active trackers
    for (const [trackerId, tracker] of Object.entries(actionsExecuting)) {
      tracker.currentStep.tick(tickMs);
      if (!tracker.currentStep.isComplete()) continue;

      const results = tracker.currentStep.onComplete();
      tracker.replayNode.events.push({
        command: results.gameUpdateCommand,
        resolutionOrderId: nextResolutionOrderId++,
      });

      for (const action of results.branchingActions) {
        // create a new replay node as a child of this one
        // push the actions to the currently executing actions
      }

      const nextStep = tracker.getNextStep();
      if (nextStep === null) delete actionsExecuting[trackerId];
    }

    time.ms += TICK_LENGTH;
  }
}
