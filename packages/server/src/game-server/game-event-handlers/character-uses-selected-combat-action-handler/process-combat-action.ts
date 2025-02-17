import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionMotionPhase,
  ActionResolutionStepType,
  ActionSequenceManagerRegistry,
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
  CombatantContext,
  CombatantMotionActionResolutionStep,
  GAME_UPDATE_COMMAND_TYPE_STRINGS,
  NestedNodeReplayEvent,
  ReplayEventType,
  SequentialIdGenerator,
} from "@speed-dungeon/common";
import { idGenerator } from "../../../singletons.js";
import { CombatActionAnimationPhase } from "@speed-dungeon/common";

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
      gameUpdate: initialGameUpdateOptionResult,
    });

  let loopLimiter = 0;

  while (
    registry.isNotEmpty()
    // &&   loopLimiter < 10 // for testing
  ) {
    for (const manager of registry.getManagers()) {
      const currentTrackerOption = manager.getCurrentTracker();
      if (!currentTrackerOption) break;
      console.log(
        "PROCESSING ACTION",
        COMBAT_ACTION_NAME_STRINGS[currentTrackerOption.actionExecutionIntent.actionName]
      );
      let currentStep = currentTrackerOption.currentStep;

      while (currentStep.isComplete()) {
        const trackerOption = manager.getCurrentTracker();
        console.log("completed:", ACTION_RESOLUTION_STEP_TYPE_STRINGS[currentStep.type]);
        if (trackerOption === null) break;

        const completionOrderId = completionOrderIdGenerator.getNextIdNumeric();
        const actionResult = trackerOption.currentStep.finalize(completionOrderId);

        if (actionResult instanceof Error) return actionResult;
        const branchingActions = actionResult;
        if (manager.getIsFinalized()) {
          registry.unRegisterActionManager(manager.id);
          break;
        }

        for (const action of branchingActions) {
          console.log("-----------");
          console.log("BRANCH");
          console.log("-----------");
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
              gameUpdate: initialGameUpdateOptionResult,
            });
        }

        trackerOption.storeCompletedStep();
        const nextStepOption = trackerOption.initializeNextStep();

        if (nextStepOption) {
          currentStep = nextStepOption;
          const gameUpdateCommandOption = nextStepOption.getGameUpdateCommandOption();
          console.log("game update option: ", gameUpdateCommandOption);
          if (gameUpdateCommandOption !== null) {
            console.log(
              "pushed update for",
              ACTION_RESOLUTION_STEP_TYPE_STRINGS[nextStepOption.type]
            );
            manager.replayNode.events.push({
              type: ReplayEventType.GameUpdate,
              gameUpdate: gameUpdateCommandOption,
            });
          } else {
            console.log(
              "NO GAME UPDATE FOR STEP",
              ACTION_RESOLUTION_STEP_TYPE_STRINGS[nextStepOption.type]
            );
          }
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
              gameUpdate: initialGameUpdateOptionResult,
            });
          continue;
        }

        // this action sequence is done, send the user home if the action type necessitates it
        const currentTrackerOption = manager.getCurrentTracker();
        if (currentTrackerOption) {
          const action = COMBAT_ACTIONS[currentTrackerOption.actionExecutionIntent.actionName];
          if (action.userShouldMoveHomeOnComplete) {
            const returnHomeStep = new CombatantMotionActionResolutionStep(
              currentTrackerOption.currentStep.getContext(),
              ActionResolutionStepType.FinalPositioning,
              ActionMotionPhase.Final,
              CombatActionAnimationPhase.Final
            );

            currentTrackerOption.currentStep = returnHomeStep;
            currentStep = returnHomeStep;
            const returnHomeUpdate = returnHomeStep.getGameUpdateCommandOption();
            if (returnHomeUpdate)
              manager.replayNode.events.push({
                type: ReplayEventType.GameUpdate,
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

    loopLimiter += 1;
  }

  return rootReplayNode;
}
