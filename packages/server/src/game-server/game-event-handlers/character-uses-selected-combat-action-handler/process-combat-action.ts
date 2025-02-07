import {
  ActionSequenceManagerRegistry,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatantContext,
  NestedNodeReplayEvent,
  ReplayEventNode,
  ReplayEventType,
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
  const rootReplayNode: NestedNodeReplayEvent = { type: ReplayEventType.NestedNode, events: [] };
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
  if (initialGameUpdateOptionResult)
    rootReplayNode.events.push({
      type: ReplayEventType.GameUpdate,
      events: [],
      gameUpdate: initialGameUpdateOptionResult,
    });

  while (registry.isNotEmpty()) {
    for (const manager of registry.getManagers()) {
      while (manager.getCurrentTracker()?.currentStep.isComplete()) {
        const trackerOption = manager.getCurrentTracker();
        if (trackerOption === null) break;

        const completionOrderId = completionOrderIdGenerator.getNextIdNumeric();
        const actionResult = trackerOption.currentStep.finalize(completionOrderId);
        if (actionResult instanceof Error) return actionResult;
        const { branchingActions, nextStepOption } = actionResult;
        if (manager.getIsFinalized()) {
          registry.unRegisterActionManager(manager.id);
          break;
        }

        for (const action of branchingActions) {
          console.log("branch");
          const nestedReplayNode: NestedNodeReplayEvent = {
            type: ReplayEventType.NestedNode,
            events: [],
          };
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
            nestedReplayNode.events.push({
              type: ReplayEventType.GameUpdate,
              events: [],
              gameUpdate: initialGameUpdateOptionResult,
            });
        }

        if (nextStepOption) {
          trackerOption.storeCompletedStep();
          trackerOption.currentStep = nextStepOption;
          const gameUpdateCommandOption = nextStepOption.getGameUpdateCommandOption();
          if (gameUpdateCommandOption)
            manager.replayNode.events.push({
              type: ReplayEventType.GameUpdate,
              events: [],
              gameUpdate: gameUpdateCommandOption,
            });
          continue;
        }

        manager.populateSelfWithCurrentActionChildren();

        if (manager.getNextActionInQueue()) {
          const stepTrackerResult = manager.startProcessingNext(time);
          if (stepTrackerResult instanceof Error) return stepTrackerResult;

          const initialGameUpdateOptionResult =
            stepTrackerResult.currentStep.getGameUpdateCommandOption();
          if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;

          if (initialGameUpdateOptionResult)
            manager.replayNode.events.push({
              type: ReplayEventType.GameUpdate,
              events: [],
              gameUpdate: initialGameUpdateOptionResult,
            });
          continue;
        }

        // this action sequence is done, send the user home if the action type necessitates it
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
            if (returnHomeUpdate)
              manager.replayNode.events.push({
                type: ReplayEventType.GameUpdate,
                events: [],
                gameUpdate: returnHomeUpdate,
              });
          }
        }
        manager.markAsFinalized();
      }
    }

    const timeToTick = registry.getShortestTimeToCompletion();
    time.ms += timeToTick;

    for (const manager of registry.getManagers())
      manager.getCurrentTracker()?.currentStep.tick(timeToTick);
  }

  return rootReplayNode;
}
