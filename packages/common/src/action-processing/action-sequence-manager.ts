import { COMBAT_ACTIONS, CombatActionExecutionIntent } from "../combat/index.js";
import { ActionSequenceManagerRegistry } from "./action-sequence-manager-registry.js";
import { NestedNodeReplayEvent, NestedNodeReplayEventUtls } from "./replay-events.js";
import { ActionTracker } from "./action-tracker.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ActionUserContext } from "../action-user-context/index.js";
import { LOOP_SAFETY_ITERATION_LIMIT } from "../app-consts.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ACTION_RESOLUTION_STEP_TYPE_STRINGS } from "./action-steps/index.js";

export class ActionSequenceManager {
  private remainingActionsToExecute: CombatActionExecutionIntent[];
  private currentTracker: null | ActionTracker = null;
  private completedTrackers: ActionTracker[] = [];
  constructor(
    public id: string,
    actionExecutionIntent: CombatActionExecutionIntent,
    public replayNode: NestedNodeReplayEvent,
    public actionUserContext: ActionUserContext,
    public sequentialActionManagerRegistry: ActionSequenceManagerRegistry,
    private idGenerator: IdGenerator,
    private trackerThatSpawnedThisActionOption: null | ActionTracker
  ) {
    this.remainingActionsToExecute = [actionExecutionIntent];
  }
  getCompletedTrackers() {
    return this.completedTrackers;
  }
  getTopParent(): ActionSequenceManager {
    let current: ActionSequenceManager = this;
    while (current !== null) {
      const next = this.trackerThatSpawnedThisActionOption?.parentActionManager || null;
      if (next === null) return current;
      current = next;
    }
    return current;
  }
  getNextActionInQueue() {
    return this.remainingActionsToExecute[this.remainingActionsToExecute.length - 1];
  }
  getCurrentTracker() {
    return this.currentTracker;
  }
  isCurrentlyProcessing() {
    return !!this.getCurrentTracker();
  }
  isDoneProcessing() {
    return !this.isCurrentlyProcessing() && this.remainingActionsToExecute.length === 0;
  }
  getRemainingActionsToExecute() {
    return this.remainingActionsToExecute;
  }

  enqueueActionIntents(actionIntents: CombatActionExecutionIntent[]) {
    this.remainingActionsToExecute.push(...actionIntents);
  }

  startProcessingNext(): ActionTracker {
    if (this.currentTracker !== null) {
      this.completedTrackers.push(this.currentTracker);
    }

    const nextActionExecutionIntentOption = this.remainingActionsToExecute.pop();

    if (!nextActionExecutionIntentOption)
      throw new Error("Tried to process next action but there wasn't one");

    let previousTrackerOption: null | ActionTracker = null;
    if (this.trackerThatSpawnedThisActionOption) {
      previousTrackerOption = this.trackerThatSpawnedThisActionOption;
      this.trackerThatSpawnedThisActionOption = null;
    } else {
      previousTrackerOption = this.completedTrackers[this.completedTrackers.length - 1] || null;
    }

    const tracker = new ActionTracker(
      this,
      this.sequentialActionManagerRegistry.actionStepIdGenerator.getNextId(),
      nextActionExecutionIntentOption,
      this.actionUserContext.actionUser,
      previousTrackerOption || null,
      this.sequentialActionManagerRegistry.time.ms,
      this.idGenerator
    );

    this.currentTracker = tracker;

    return tracker;
  }

  processCurrentStep(actionUserContext: ActionUserContext) {
    let trackerOption = this.getCurrentTracker();
    if (!trackerOption) return;
    let currentStep = trackerOption.currentStep;

    const { sequentialActionManagerRegistry } = this;

    let safetyCounter = -1;
    while (currentStep.isComplete()) {
      safetyCounter += 1;
      if (safetyCounter > LOOP_SAFETY_ITERATION_LIMIT) {
        console.error(
          ERROR_MESSAGES.LOOP_SAFETY_ITERATION_LIMIT_REACHED(LOOP_SAFETY_ITERATION_LIMIT),
          "in action-sequence-manager",
          "currentStep:",
          ACTION_RESOLUTION_STEP_TYPE_STRINGS[currentStep.type]
        );
        break;
      }

      trackerOption = this.getCurrentTracker();
      if (trackerOption === null) throw new Error("expected action tracker was missing");

      const { completionOrderIdGenerator } = sequentialActionManagerRegistry;
      const completionOrderId = completionOrderIdGenerator.getNextIdNumeric();
      const branchingActionsResult = trackerOption.currentStep.finalize(completionOrderId);
      if (branchingActionsResult instanceof Error) return branchingActionsResult;
      const branchingActions = branchingActionsResult;

      // REGISTER BRANCHING ACTIONS
      sequentialActionManagerRegistry.registerActions(
        this,
        trackerOption,
        actionUserContext,
        branchingActions
      );

      trackerOption.storeCompletedStep();

      if (!trackerOption.wasAborted) {
        let nextStepOption = trackerOption.initializeNextStep();

        // START NEXT STEPS
        if (nextStepOption !== null) {
          trackerOption.currentStep = nextStepOption;
          currentStep = nextStepOption;
          const gameUpdateCommandOption = nextStepOption.getGameUpdateCommandOption();

          if (gameUpdateCommandOption !== null) {
            const { replayNode } = this;
            NestedNodeReplayEventUtls.appendGameUpdate(replayNode, gameUpdateCommandOption);
          } else {
            /* no update for this step */
          }

          continue;
        }

        const nextActionIntentInQueueOption = this.getNextActionInQueue();
        const nextActionOption = nextActionIntentInQueueOption
          ? COMBAT_ACTIONS[nextActionIntentInQueueOption.actionName]
          : null;

        if (nextActionOption) {
          const stepTracker = this.startProcessingNext();

          const initialGameUpdateOptionResult =
            stepTracker.currentStep.getGameUpdateCommandOption();
          if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;

          if (initialGameUpdateOptionResult) {
            const { replayNode } = this;
            NestedNodeReplayEventUtls.appendGameUpdate(replayNode, initialGameUpdateOptionResult);
          }

          currentStep = stepTracker.currentStep;
          continue;
        }
      }

      sequentialActionManagerRegistry.unRegisterActionManager(this.id);
      break;
    }
  }
}
