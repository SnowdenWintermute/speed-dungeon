import {
  ActionResolutionStepType,
  ActionSequenceManagerRegistry,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
  CombatantContext,
  CombatantMotionActionResolutionStep,
  InputLock,
  NestedNodeReplayEvent,
  ReplayEventType,
  SequentialIdGenerator,
} from "@speed-dungeon/common";
import { ANIMATION_LENGTHS, idGenerator } from "../../../singletons.js";

class TimeKeeper {
  ms: number = 0;
  constructor() {}
}

export function processCombatAction(
  actionExecutionIntent: CombatActionExecutionIntent,
  combatantContext: CombatantContext
) {
  const registry = new ActionSequenceManagerRegistry(idGenerator, ANIMATION_LENGTHS);
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
  //

  if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;
  if (initialGameUpdateOptionResult) {
    rootReplayNode.events.push({
      type: ReplayEventType.GameUpdate,
      gameUpdate: initialGameUpdateOptionResult,
    });
  }

  InputLock.lockInput(combatantContext.party.inputLock);

  while (registry.isNotEmpty()) {
    for (const sequenceManager of registry.getManagers()) {
      let trackerOption = sequenceManager.getCurrentTracker();

      if (!trackerOption) break;

      let currentStep = trackerOption.currentStep;

      while (currentStep.isComplete()) {
        trackerOption = sequenceManager.getCurrentTracker();
        if (trackerOption === null) throw new Error("expected action tracker was missing");

        const completionOrderId = completionOrderIdGenerator.getNextIdNumeric();
        const branchingActionsResult = trackerOption.currentStep.finalize(completionOrderId);
        if (branchingActionsResult instanceof Error) return branchingActionsResult;
        const branchingActions = branchingActionsResult;

        // REGISTER BRANCHING ACTIONS
        for (const action of branchingActions) {
          const nestedReplayNode: NestedNodeReplayEvent = {
            type: ReplayEventType.NestedNode,
            events: [],
          };
          sequenceManager.replayNode.events.push(nestedReplayNode);

          const modifiedContextWithActionUser = new CombatantContext(
            combatantContext.game,
            combatantContext.party,
            action.user
          );

          const initialGameUpdateOptionResult = registry.registerAction(
            action.actionExecutionIntent,
            nestedReplayNode,
            modifiedContextWithActionUser,
            trackerOption,
            time
          );
          if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;

          if (initialGameUpdateOptionResult) {
            nestedReplayNode.events.push({
              type: ReplayEventType.GameUpdate,
              gameUpdate: initialGameUpdateOptionResult,
            });
          }
        }

        trackerOption.storeCompletedStep();
        const nextStepOption = trackerOption.initializeNextStep();

        // START NEXT STEPS
        if (nextStepOption !== null) {
          trackerOption.currentStep = nextStepOption;
          currentStep = nextStepOption;
          const gameUpdateCommandOption = nextStepOption.getGameUpdateCommandOption();
          if (gameUpdateCommandOption !== null) {
            sequenceManager.replayNode.events.push({
              type: ReplayEventType.GameUpdate,
              gameUpdate: gameUpdateCommandOption,
            });
          } else {
            /* no update for this step */
          }
          continue;
        }

        // DETERMINE NEXT ACTION IN SEQUENCE IF ANY
        sequenceManager.populateSelfWithCurrentActionChildren();

        const nextActionIntentInQueueOption = sequenceManager.getNextActionInQueue();
        const nextActionOption = nextActionIntentInQueueOption
          ? COMBAT_ACTIONS[nextActionIntentInQueueOption.actionName]
          : null;

        // ex: main hand attack killed target, off hand attack should not execute
        if (nextActionOption && nextActionOption.shouldExecute(combatantContext, trackerOption)) {
          const stepTrackerResult = sequenceManager.startProcessingNext(time);
          if (stepTrackerResult instanceof Error) return stepTrackerResult;

          const initialGameUpdateOptionResult =
            stepTrackerResult.currentStep.getGameUpdateCommandOption();
          if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;

          if (initialGameUpdateOptionResult)
            sequenceManager.replayNode.events.push({
              type: ReplayEventType.GameUpdate,
              gameUpdate: initialGameUpdateOptionResult,
            });
          currentStep = stepTrackerResult.currentStep;
          continue;
        }

        if (sequenceManager.getIsFinalized()) {
          registry.unRegisterActionManager(sequenceManager.id);
          break;
        }

        // if we got this far, this action sequence is done,
        sequenceManager.markAsFinalized();
        // send the user home if the action type necessitates it
        const action = COMBAT_ACTIONS[trackerOption.actionExecutionIntent.actionName];

        if (
          action.stepsConfig.options.userShouldMoveHomeOnComplete
          // combatantContext.combatant.combatantProperties.hitPoints > 0
        ) {
          const returnHomeStep = new CombatantMotionActionResolutionStep(
            trackerOption.currentStep.getContext(),
            ActionResolutionStepType.FinalPositioning
          );

          trackerOption.currentStep = returnHomeStep;
          currentStep = returnHomeStep;

          const returnHomeUpdate = returnHomeStep.getGameUpdateCommandOption();
          if (returnHomeUpdate)
            sequenceManager.replayNode.events.push({
              type: ReplayEventType.GameUpdate,
              gameUpdate: returnHomeUpdate,
            });
        } else {
          registry.unRegisterActionManager(sequenceManager.id);
          break;
        }
      }
    }

    const timeToTick = registry.getShortestTimeToCompletion();
    time.ms += timeToTick;

    for (const sequenceManager of registry.getManagers())
      sequenceManager.getCurrentTracker()?.currentStep.tick(timeToTick);
  }

  setTimeout(() => {
    InputLock.unlockInput(combatantContext.party.inputLock);
  }, time.ms);

  const endedTurn = registry.getTurnEnded();

  return { rootReplayNode, endedTurn };
}
