import {
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
} from "../combat/index.js";
import { CombatantContext } from "../combatant-context/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { ActionSequenceManagerRegistry } from "./action-sequence-manager-registry.js";
import { NestedNodeReplayEvent, NestedNodeReplayEventUtls } from "./replay-events.js";
import { ActionTracker } from "./action-tracker.js";
import { IdGenerator } from "../utility-classes/index.js";
import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionResolutionStepType,
} from "./action-steps/index.js";

export class ActionSequenceManager {
  private remainingActionsToExecute: CombatActionExecutionIntent[];
  private currentTracker: null | ActionTracker = null;
  private completedTrackers: ActionTracker[] = [];
  constructor(
    public id: string,
    actionExecutionIntent: CombatActionExecutionIntent,
    public replayNode: NestedNodeReplayEvent,
    public combatantContext: CombatantContext,
    public sequentialActionManagerRegistry: ActionSequenceManagerRegistry,
    private idGenerator: IdGenerator,
    private trackerThatSpawnedThisActionOption: null | ActionTracker
  ) {
    this.remainingActionsToExecute = [actionExecutionIntent];
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
  // action children may depend on the outcome of their parent so we must process their parent first
  populateSelfWithCurrentActionChildren() {
    const currentActionExecutionIntent = this.currentTracker?.actionExecutionIntent;
    if (!currentActionExecutionIntent || !this.currentTracker) return;
    const currentAction = COMBAT_ACTIONS[currentActionExecutionIntent.actionName];

    const children = currentAction.hierarchyProperties.getChildren(
      {
        combatantContext: this.combatantContext,
        tracker: this.currentTracker,
        manager: this,
        idGenerator: this.idGenerator,
      },
      currentAction
    );

    console.log(
      "action children for",
      COMBAT_ACTION_NAME_STRINGS[currentActionExecutionIntent.actionName],
      children.map((childaction) => COMBAT_ACTION_NAME_STRINGS[childaction.name])
    );

    const childActionIntents = [];
    for (const action of children) {
      const targetsResult = action.targetingProperties.getAutoTarget(
        this.combatantContext,
        this.currentTracker
      );
      if (targetsResult instanceof Error) {
        console.error(targetsResult);
        continue;
      }
      if (targetsResult === null) {
        console.error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED);
        continue;
      }

      const actionLevel = currentActionExecutionIntent.level;

      this.sequentialActionManagerRegistry.incrementInputLockReferenceCount();
      childActionIntents.push(
        new CombatActionExecutionIntent(action.name, targetsResult, actionLevel)
      );
    }

    this.remainingActionsToExecute.push(...childActionIntents.reverse());
  }

  enqueueActionIntents(actionIntents: CombatActionExecutionIntent[]) {
    this.remainingActionsToExecute.push(...actionIntents);
  }

  startProcessingNext(): Error | ActionTracker {
    if (this.currentTracker) {
      this.completedTrackers.push(this.currentTracker);
    }

    const nextActionExecutionIntentOption = this.remainingActionsToExecute.pop();
    if (!nextActionExecutionIntentOption)
      return new Error("Tried to process next action but there wasn't one");

    let previousTrackerOption: null | ActionTracker = null;
    if (this.trackerThatSpawnedThisActionOption) {
      previousTrackerOption = this.trackerThatSpawnedThisActionOption;
      this.trackerThatSpawnedThisActionOption = null;
    } else {
      previousTrackerOption = this.completedTrackers[this.completedTrackers.length - 1] || null;
    }

    try {
      const tracker = new ActionTracker(
        this,
        this.sequentialActionManagerRegistry.actionStepIdGenerator.getNextId(),
        nextActionExecutionIntentOption,
        previousTrackerOption || null,
        this.sequentialActionManagerRegistry.time.ms,
        this.idGenerator,
        previousTrackerOption?.spawnedEntityOption
      );

      this.currentTracker = tracker;

      return tracker;
    } catch (err) {
      return err as unknown as Error;
    }
  }

  processCurrentStep(combatantContext: CombatantContext) {
    let trackerOption = this.getCurrentTracker();
    if (!trackerOption) return;
    let currentStep = trackerOption.currentStep;

    const { sequentialActionManagerRegistry } = this;

    while (currentStep.isComplete()) {
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
        combatantContext,
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

        // DETERMINE NEXT ACTION IN SEQUENCE IF ANY
        // if (currentStep.type === ActionResolutionStepType.DetermineChildActions)
        // this.populateSelfWithCurrentActionChildren();

        const nextActionIntentInQueueOption = this.getNextActionInQueue();
        const nextActionOption = nextActionIntentInQueueOption
          ? COMBAT_ACTIONS[nextActionIntentInQueueOption.actionName]
          : null;

        if (nextActionOption) {
          const stepTrackerResult = this.startProcessingNext();
          if (stepTrackerResult instanceof Error) return stepTrackerResult;

          const initialGameUpdateOptionResult =
            stepTrackerResult.currentStep.getGameUpdateCommandOption();
          if (initialGameUpdateOptionResult instanceof Error) return initialGameUpdateOptionResult;

          if (initialGameUpdateOptionResult) {
            const { replayNode } = this;
            NestedNodeReplayEventUtls.appendGameUpdate(replayNode, initialGameUpdateOptionResult);
          }

          currentStep = stepTrackerResult.currentStep;
          continue;
        }
      }

      sequentialActionManagerRegistry.unRegisterActionManager(this.id);
      break;
    }
  }
}
