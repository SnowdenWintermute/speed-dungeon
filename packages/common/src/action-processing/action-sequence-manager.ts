import {
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  CombatActionExecutionIntent,
} from "../combat/index.js";
import { CombatantContext } from "../combatant-context/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Milliseconds } from "../primatives/index.js";
import { ActionSequenceManagerRegistry } from "./action-sequence-manager-registry.js";
import { NestedNodeReplayEvent } from "./replay-events.js";
import { ActionTracker } from "./action-tracker.js";
import { IdGenerator } from "../utility-classes/index.js";

export class ActionSequenceManager {
  private remainingActionsToExecute: CombatActionExecutionIntent[];
  private currentTracker: null | ActionTracker = null;
  private completedTrackers: ActionTracker[] = [];
  private isFinalized: boolean = false;
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

    const children = currentAction.getChildren({
      combatantContext: this.combatantContext,
      tracker: this.currentTracker,
      manager: this,
      idGenerator: this.idGenerator,
    });

    const childActionIntentResults = children.map((action) => {
      const targets = action.targetingProperties.getAutoTarget(
        this.combatantContext,
        this.currentTracker
      );

      return {
        actionName: action.name,
        targets,
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

  startProcessingNext(time: { ms: Milliseconds }): Error | ActionTracker {
    if (this.currentTracker) this.completedTrackers.push(this.currentTracker);
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
        time.ms,
        this.idGenerator,
        previousTrackerOption?.spawnedEntityOption
      );

      this.currentTracker = tracker;

      return tracker;
    } catch (err) {
      return err as unknown as Error;
    }
  }
}
