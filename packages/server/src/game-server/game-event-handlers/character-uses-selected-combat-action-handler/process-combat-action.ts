import {
  CombatActionExecutionIntent,
  CombatantContext,
  ReplayEventNode,
  SequentialIdGenerator,
} from "@speed-dungeon/common";
import { SequentialActionExecutionManagerRegistry } from "./sequential-action-manager-registry.js";
import { ActionExecutionTrackerRegistry } from "./action-execution-tracker-registry.js";

export function processCombatAction(
  actionExecutionIntent: CombatActionExecutionIntent,
  combatantContext: CombatantContext
) {
  const sequentialActionManagerRegistry = new SequentialActionExecutionManagerRegistry();
  const rootReplayNode = new ReplayEventNode();
  sequentialActionManagerRegistry.registerAction(
    actionExecutionIntent,
    rootReplayNode,
    combatantContext,
    null
  );
  const actionExecutionTrackerRegistry = new ActionExecutionTrackerRegistry();

  const time = { ms: 0 };
  const actionStepIdGenerator = new SequentialIdGenerator();
  const completionOrderIdGenerator = new SequentialIdGenerator();

  while (
    sequentialActionManagerRegistry.isNotEmpty() ||
    actionExecutionTrackerRegistry.isNotEmpty()
  ) {
    for (const [id, manager] of sequentialActionManagerRegistry.getManagers()) {
      console.log("action manager isDoneProcessing", manager.isDoneProcessing());

      if (manager.isDoneProcessing() && manager.hasExhaustedActionTree()) {
        sequentialActionManagerRegistry.unRegisterAction(id);
        continue;
      }

      if (manager.isDoneProcessing() || manager.isCurrentlyProcessing()) continue;

      const tracker = manager.startProcessingNext(actionStepIdGenerator, time);

      actionExecutionTrackerRegistry.registerTracker(tracker);
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
      while (tracker.currentStep.isComplete()) {
        const { nextStepOption, branchingActions } = tracker.currentStep.finalize(
          completionOrderIdGenerator.getNextIdNumeric()
        );

        tracker.storeCompletedStep();

        for (const { user, actionExecutionIntent } of branchingActions) {
          const nestedReplayNode = new ReplayEventNode();
          tracker.replayNode.events.push(nestedReplayNode);

          // branching actions may have a different user than the triggering action
          const nestedCombatantContext = new CombatantContext(
            combatantContext.game,
            combatantContext.party,
            user
          );
          const branchedActionManager = sequentialActionManagerRegistry.registerAction(
            actionExecutionIntent,
            nestedReplayNode,
            nestedCombatantContext,
            tracker
          );
        }

        if (nextStepOption === null) {
          actionExecutionTrackerRegistry.unRegisterTracker(tracker.id);
          const actionManagerOption = sequentialActionManagerRegistry.getManager(
            tracker.sequentialActionManagerId
          );
          if (actionManagerOption) {
            actionManagerOption.populateSelfWithCurrentActionChildren();
            actionManagerOption.clearCurrentAction();
          }
          console.log("UNREGISTERED");
          break;
        } else {
          tracker.currentStep = nextStepOption;
        }
        const gameUpdateCommandStarted = tracker.currentStep.getGameUpdateCommand();
        tracker.replayNode.events.push(gameUpdateCommandStarted);
      }
    }
  }

  return rootReplayNode;
}
