import {
  ActionExecutionTracker,
  CombatActionExecutionIntent,
  CombatantContext,
  ReplayEventNode,
  SequentialActionExecutionManagerRegistry,
  SequentialIdGenerator,
} from "@speed-dungeon/common";
import { ActionExecutionTrackerRegistry } from "./action-execution-tracker-registry.js";
import { idGenerator } from "../../../singletons.js";

class TimeKeeper {
  ms: number = 0;
  constructor() {}
}

export function processCombatAction(
  actionExecutionIntent: CombatActionExecutionIntent,
  combatantContext: CombatantContext
) {
  const sequentialActionManagerRegistry = new SequentialActionExecutionManagerRegistry(idGenerator);
  const rootReplayNode = new ReplayEventNode();
  sequentialActionManagerRegistry.registerAction(
    actionExecutionIntent,
    rootReplayNode,
    combatantContext,
    null
  );
  const actionExecutionTrackerRegistry = new ActionExecutionTrackerRegistry();

  const time = new TimeKeeper();
  const completionOrderIdGenerator = new SequentialIdGenerator();

  while (
    sequentialActionManagerRegistry.isNotEmpty() ||
    actionExecutionTrackerRegistry.isNotEmpty()
  ) {
    // check if any sequentialActionManager is done processing and determine its next actions
    for (const [id, manager] of sequentialActionManagerRegistry.getManagers()) {
      if (manager.isCurrentlyProcessing()) continue;

      manager.populateSelfWithCurrentActionChildren();

      if (manager.isDoneProcessing()) {
        sequentialActionManagerRegistry.unRegisterAction(id);
        continue;
      }

      const trackerResult = manager.startProcessingNext(time);
      if (trackerResult instanceof Error) return trackerResult;
      actionExecutionTrackerRegistry.registerTracker(trackerResult);

      trackerResult.addCurrentStepGameUpdateCommandToReplayNode();
    }

    // tick active ActionExecutionTrackers
    const timeToTick = actionExecutionTrackerRegistry.getShortestTimeToCompletion();
    const trackers = actionExecutionTrackerRegistry.getTrackers();

    for (const tracker of trackers) tracker.currentStep.tick(timeToTick);
    time.ms += timeToTick;
    // we must either sort and process by shortest time to complete, or loop twice
    // so we can be assured that all trackers who's completion may have been triggered
    // by the effects of the shortestTimeToCompletion tracker are taken into account
    for (const tracker of trackers) {
      if (!tracker.currentStep.isComplete()) continue;
      // process all instantly processable steps
      processActionTrackerSteps(
        tracker,
        combatantContext,
        completionOrderIdGenerator,
        sequentialActionManagerRegistry,
        actionExecutionTrackerRegistry
      );
    }
  }

  return rootReplayNode;
}

function processActionTrackerSteps(
  tracker: ActionExecutionTracker,
  combatantContext: CombatantContext,
  completionOrderIdGenerator: SequentialIdGenerator,
  sequentialActionManagerRegistry: SequentialActionExecutionManagerRegistry,
  actionExecutionTrackerRegistry: ActionExecutionTrackerRegistry
) {
  while (tracker.currentStep.isComplete()) {
    const { nextStepOption, branchingActions } = tracker.currentStep.finalize(
      completionOrderIdGenerator.getNextIdNumeric()
    );

    tracker.storeCompletedStep();

    for (const { user, actionExecutionIntent } of branchingActions) {
      const nestedReplayNode = new ReplayEventNode();
      tracker.parentActionManager.replayNode.events.push(nestedReplayNode);

      // branching actions may have a different user than the triggering action
      const nestedCombatantContext = new CombatantContext(
        combatantContext.game,
        combatantContext.party,
        user
      );

      sequentialActionManagerRegistry.registerAction(
        actionExecutionIntent,
        nestedReplayNode,
        nestedCombatantContext,
        tracker
      );
    }

    if (nextStepOption === null) {
      actionExecutionTrackerRegistry.unRegisterTracker(tracker.id);

      const { parentActionManager } = tracker;
      parentActionManager.populateSelfWithCurrentActionChildren();
      parentActionManager.clearCurrentAction();

      break;
    }

    tracker.currentStep = nextStepOption;
    tracker.addCurrentStepGameUpdateCommandToReplayNode();
  }
}
