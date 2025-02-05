import {
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
} from "../combat/index.js";
import { ReplayEventNode } from "./replay-events.js";
import { CombatantContext } from "../combatant-context/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Milliseconds } from "../primatives/index.js";
import { ActionStepTracker } from "./action-step-tracker.js";
import { ActionSequenceManagerRegistry } from "./action-sequence-manager-registry.js";

export class ActionSequenceManager {
  private remainingActionsToExecute: CombatActionExecutionIntent[];
  private currentTracker: null | ActionStepTracker = null;
  private completedTrackers: ActionStepTracker[] = [];
  private isFinalized: boolean = false;
  constructor(
    public id: string,
    actionExecutionIntent: CombatActionExecutionIntent,
    public replayNode: ReplayEventNode,
    public combatantContext: CombatantContext,
    public sequentialActionManagerRegistry: ActionSequenceManagerRegistry,
    private trackerThatSpawnedThisActionOption: null | ActionStepTracker
  ) {
    this.remainingActionsToExecute = [actionExecutionIntent];
  }
  getIsFinalized() {
    return this.isFinalized;
  }
  markAsFinalized() {
    this.isFinalized = true;
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
  // action children may depend on the outcome of their parent so we must process their parent first
  populateSelfWithCurrentActionChildren() {
    const currentActionExecutionIntent = this.currentTracker?.actionExecutionIntent;
    if (!currentActionExecutionIntent || !this.currentTracker) return;
    const currentAction = COMBAT_ACTIONS[currentActionExecutionIntent.actionName];
    const childActionIntentResults = currentAction
      .getChildren(this.combatantContext, this.currentTracker)
      .map((action) => {
        return {
          actionName: action.name,
          targets: action.getAutoTarget(this.combatantContext, this.currentTracker),
        };
      });

    const childActionIntents: CombatActionExecutionIntent[] = [];
    for (const intentResult of childActionIntentResults) {
      const targetsResult = intentResult.targets;
      if (targetsResult instanceof Error) {
        console.error(intentResult.targets);
        continue;
      }
      if (targetsResult === null) {
        console.error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED);
        continue;
      }

      childActionIntents.push(
        new CombatActionExecutionIntent(intentResult.actionName, targetsResult)
      );
    }

    this.remainingActionsToExecute.push(...childActionIntents.reverse());
  }

  startProcessingNext(time: { ms: Milliseconds }): Error | ActionStepTracker {
    if (this.currentTracker) this.completedTrackers.push(this.currentTracker);
    const nextActionExecutionIntentOption = this.remainingActionsToExecute.pop();
    if (!nextActionExecutionIntentOption)
      return new Error("Tried to process next action but there wasn't one");

    let previousTrackerOption = null;
    if (this.trackerThatSpawnedThisActionOption) {
      previousTrackerOption = this.trackerThatSpawnedThisActionOption;
      this.trackerThatSpawnedThisActionOption = null;
    } else {
      previousTrackerOption = this.completedTrackers[this.completedTrackers.length - 1];
    }

    try {
      const tracker = new ActionStepTracker(
        this,
        this.sequentialActionManagerRegistry.actionStepIdGenerator.getNextId(),
        nextActionExecutionIntentOption,
        previousTrackerOption || null,
        time.ms
      );

      this.currentTracker = tracker;

      return tracker;
    } catch (err) {
      return err as unknown as Error;
    }
  }
}
