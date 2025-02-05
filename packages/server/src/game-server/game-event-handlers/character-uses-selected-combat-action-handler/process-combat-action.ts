import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionSequenceManagerRegistry,
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
  CombatantContext,
  ReplayEventNode,
  SequentialIdGenerator,
} from "@speed-dungeon/common";
import { idGenerator } from "../../../singletons.js";
import { PostUsePositioningActionResolutionStep } from "@speed-dungeon/common";

class TimeKeeper {
  ms: number = 0;
  constructor() {}
}

export function processCombatAction(
  actionExecutionIntent: CombatActionExecutionIntent,
  combatantContext: CombatantContext
) {
  const registry = new ActionSequenceManagerRegistry(idGenerator);
  const rootReplayNode = new ReplayEventNode(actionExecutionIntent.actionName);
  const time = new TimeKeeper();
  const completionOrderIdGenerator = new SequentialIdGenerator();

  const initialGameUpdateOptionResult = registry.registerAction(
    actionExecutionIntent,
    rootReplayNode,
    combatantContext,
    null,
    time
  );

  if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;
  if (initialGameUpdateOptionResult) rootReplayNode.events.push(initialGameUpdateOptionResult);

  while (registry.isNotEmpty()) {
    // iterate the managers
    for (const manager of registry.getManagers()) {
      while (manager.getCurrentTracker()?.currentStep.isComplete()) {
        const trackerOption = manager.getCurrentTracker();
        if (trackerOption === null) break;

        const completionOrderId = completionOrderIdGenerator.getNextIdNumeric();
        const { branchingActions, nextStepOption } =
          trackerOption.currentStep.finalize(completionOrderId);

        if (manager.getIsFinalized()) {
          registry.unRegisterActionManager(manager.id);
          break;
        }

        for (const action of branchingActions) {
          console.log("branch");
          const nestedReplayNode = new ReplayEventNode(action.actionExecutionIntent.actionName);
          manager.replayNode.events.push(nestedReplayNode);
          const initialGameUpdateOptionResult = registry.registerAction(
            action.actionExecutionIntent,
            nestedReplayNode,
            combatantContext,
            trackerOption,
            time
          );
          if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;
          if (initialGameUpdateOptionResult)
            nestedReplayNode.events.push(initialGameUpdateOptionResult);
        }

        if (nextStepOption === null) {
          manager.populateSelfWithCurrentActionChildren();

          if (manager.getNextActionInQueue() === undefined) {
            const currentTrackerOption = manager.getCurrentTracker();
            if (currentTrackerOption) {
              const action = COMBAT_ACTIONS[currentTrackerOption.actionExecutionIntent.actionName];
              if (action.userShouldMoveHomeOnComplete) {
                const returnHomeStep = new PostUsePositioningActionResolutionStep(
                  currentTrackerOption.currentStep.getContext(),
                  "Run Back"
                );

                currentTrackerOption.currentStep = returnHomeStep;
                const returnHomeUpdate = returnHomeStep.getGameUpdateCommandOption();
                if (returnHomeUpdate) manager.replayNode.events.push(returnHomeUpdate);
              }
            }
            manager.markAsFinalized();
          } else {
            const stepTrackerResult = manager.startProcessingNext(time);
            if (stepTrackerResult instanceof Error) return stepTrackerResult;

            const initialGameUpdateOptionResult =
              stepTrackerResult.currentStep.getGameUpdateCommandOption();
            if (initialGameUpdateOptionResult instanceof Error)
              return initialGameUpdateOptionResult;

            if (initialGameUpdateOptionResult)
              manager.replayNode.events.push(initialGameUpdateOptionResult);
          }
        } else {
          trackerOption.storeCompletedStep();
          trackerOption.currentStep = nextStepOption;
          const gameUpdateCommandOption = nextStepOption.getGameUpdateCommandOption();
          if (gameUpdateCommandOption) manager.replayNode.events.push(gameUpdateCommandOption);
        }
      }
    }

    const timeToTick = registry.getShortestTimeToCompletion();
    time.ms += timeToTick;

    for (const manager of registry.getManagers())
      manager.getCurrentTracker()?.currentStep.tick(timeToTick);
  }
  return rootReplayNode;
}
