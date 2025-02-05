import {
  ActionSequenceManagerRegistry,
  ActionStepTracker,
  CombatActionExecutionIntent,
  CombatantContext,
  ReplayEventNode,
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
  const actionSequenceManagerRegistry = new ActionSequenceManagerRegistry(idGenerator);
  const rootReplayNode = new ReplayEventNode();
  actionSequenceManagerRegistry.registerAction(
    actionExecutionIntent,
    rootReplayNode,
    combatantContext,
    null
  );
  const actionExecutionTrackerRegistry = new ActionExecutionTrackerRegistry();

  const time = new TimeKeeper();
  const completionOrderIdGenerator = new SequentialIdGenerator();

  while (
    actionSequenceManagerRegistry.isNotEmpty() ||
    actionExecutionTrackerRegistry.isNotEmpty()
  ) {
    // check if any sequentialActionManager is done processing and determine its next actions
    for (const [id, manager] of actionSequenceManagerRegistry.getManagers()) {
      if (manager.isCurrentlyProcessing()) continue;

      manager.populateSelfWithCurrentActionChildren();

      if (manager.isDoneProcessing()) {
        actionSequenceManagerRegistry.unRegisterActionManager(id);
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
        actionSequenceManagerRegistry,
        actionExecutionTrackerRegistry
      );
    }
  }

  return rootReplayNode;
}

function processActionTrackerSteps(
  tracker: ActionStepTracker,
  combatantContext: CombatantContext,
  completionOrderIdGenerator: SequentialIdGenerator,
  sequentialActionManagerRegistry: ActionSequenceManagerRegistry,
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

// get user input actionExecutionIntent and create a actionSequenceManager
//   - pop the next action
//   - get it's first step
//   - set the tracker's current step
//   - add the step to replay node
//
//   - make an actionStepTracker and make it this sequence's step tracker
//
// hold the actionSequenceManager in a registry
//
// iterate all actionSequenceManagers
//
// whlie current tracker and tracker.currentStep.isDone()
//   - if(manager.isFinalized)
//     - remove the actionSequenceManager
//
//   - finalize the step, applying its completionOrderId and storing it in a completed list on the tracker
//   - get next step and branchingActions
//   - register branchingActions with their own actionSequenceManagers
//
//   - if next step === null
//     - calculate any upcoming actions
//     - if no upcoming actions,
//       - set the tracker's currentStep to returnHome
//       - set the tracker's manager as "finalized"
//     - else
//       - pop the next action
//       - get it's first step
//       - set the tracker's current step
//       - add the step to replay node
//   - else
//     - set the next step as the current step
//     - add the step to replay node
//
// sort actionStepTrackers by shortestTimeToCompletion
// iterate all actionStepTrackers
// - tick them by the shortestTimeToCompletion
