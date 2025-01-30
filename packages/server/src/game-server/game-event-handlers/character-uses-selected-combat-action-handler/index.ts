import {
  ActionExecutionTracker,
  COMBAT_ACTIONS,
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantAssociatedData,
  ERROR_MESSAGES,
  InputLock,
  ReplayEventNode,
  TICK_LENGTH,
} from "@speed-dungeon/common";
import { validateCombatActionUse } from "../combat-action-results-processing/validate-combat-action-use.js";
import { getGameServer } from "../../../singletons.js";
import { Milliseconds } from "@speed-dungeon/common";
import { CombatActionExecutionIntent } from "@speed-dungeon/common/src/combat/combat-actions/combat-action-execution-intent.js";
import { config } from "dotenv";

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
  const resolutionOrderIdGenerator = new SequentialIdGenerator();
  const nextActionExecutionTrackerIdGenerator = new SequentialIdGenerator();
  const actionsExecuting: { [id: string]: ActionExecutionTracker } = {};
  const time: { ms: Milliseconds } = { ms: 0 };

  const depthFirstChildrenInExecutionOrder = action
    .getChildrenRecursive(combatantContext.combatant)
    .reverse();

  const rootReplayTreeNode = new ReplayEventNode();

  let currentParentActionTracker: null | ActionExecutionTracker = null;

  while (Object.values(actionsExecuting).length || !sequenceStarted) {
    if (!sequenceStarted) sequenceStarted = true;

    // get the next parent action in sequence if haven't yet or one remains to be processed
    while (depthFirstChildrenInExecutionOrder.length && currentParentActionTracker === null) {
      const nextParentActionTrackerOptionResult = getNextParentActionExecutionTracker(
        depthFirstChildrenInExecutionOrder,
        combatantContext,
        rootReplayTreeNode,
        nextActionExecutionTrackerIdGenerator,
        time
      );
      if (nextParentActionTrackerOptionResult instanceof Error) {
        console.error(nextParentActionTrackerOptionResult);
        break;
      }
      if (!nextParentActionTrackerOptionResult) break;
      const nextParentActionTracker = nextParentActionTrackerOptionResult;

      actionsExecuting[nextParentActionTracker.id] = nextParentActionTracker;
      currentParentActionTracker = nextParentActionTracker;
    }

    const tickMs = getMsOfNextToCompleteTracker(actionsExecuting);

    // process active trackers
    for (const [trackerId, tracker] of Object.entries(actionsExecuting)) {
      tracker.currentStep.tick(tickMs);
      if (!tracker.currentStep.isComplete()) continue;

      // allow the next parent action in the original action sequence to be started in the next iteration
      if (tracker.id === currentParentActionTracker?.id) currentParentActionTracker = null;

      const results = tracker.currentStep.onComplete();
      tracker.replayNode.events.push(
        ...results.gameUpdateCommands.map((command) => {
          return {
            command,
            resolutionOrderId: resolutionOrderIdGenerator.getNextIdNumeric(),
          };
        })
      );

      for (const { actionExecutionIntent, user } of results.branchingActions) {
        const nestedReplayNode = new ReplayEventNode();
        // create a new replay node as a child of this one
        tracker.replayNode.children.push(nestedReplayNode);
        // push the actions to the currently executing actions
        const nestedActionId = nextActionExecutionTrackerIdGenerator.getNextId();

        actionsExecuting[nestedActionId] = new ActionExecutionTracker(
          nestedActionId,
          actionExecutionIntent,
          time.ms,
          combatantContext,
          nestedReplayNode
        );
      }

      const { nextStepOption } = results;
      if (nextStepOption === null) delete actionsExecuting[trackerId];
      else tracker.currentStep = nextStepOption;
    }

    time.ms += TICK_LENGTH;
  }
}

function getMsOfNextToCompleteTracker(trackers: { [id: string]: ActionExecutionTracker }) {
  // @TODO - get ms of the tracker with step nearest to completion
  return 10;
}

class SequentialIdGenerator {
  private nextId: number = 0;
  constructor() {}
  getNextId() {
    return String(this.nextId++);
  }
  getNextIdNumeric() {
    return this.nextId++;
  }
}

function getNextParentActionExecutionTracker(
  depthFirstChildrenInExecutionOrder: CombatActionComponent[],
  combatantContext: CombatantAssociatedData,
  rootReplayTreeNode: ReplayEventNode,
  nextActionExecutionTrackerIdGenerator: SequentialIdGenerator,
  time: { ms: Milliseconds }
) {
  while (depthFirstChildrenInExecutionOrder.length) {
    const nextAction = depthFirstChildrenInExecutionOrder.pop();
    if (!nextAction) break;
    if (!nextAction.shouldExecute(combatantContext)) continue;

    const actionExecutionTrackerId = nextActionExecutionTrackerIdGenerator.getNextId();
    const targetsOptionResult = nextAction.getAutoTarget(combatantContext);

    if (targetsOptionResult instanceof Error) return targetsOptionResult;
    else if (targetsOptionResult === null)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_VALID_TARGETS);

    const actionExecutionIntent = new CombatActionExecutionIntent(
      nextAction.name,
      targetsOptionResult
    );

    const replayNode = new ReplayEventNode();
    rootReplayTreeNode.children.push(replayNode);

    const tracker = new ActionExecutionTracker(
      actionExecutionTrackerId,
      actionExecutionIntent,
      time.ms,
      combatantContext,
      rootReplayTreeNode
    );

    return tracker;
  }
}
