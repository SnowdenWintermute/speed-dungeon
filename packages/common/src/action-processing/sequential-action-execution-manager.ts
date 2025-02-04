import { SequentialActionExecutionManagerRegistry } from "./sequential-action-manager-registry.js";
import { ActionExecutionTracker } from "./action-execution-tracker.js";
import {
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
} from "../combat/index.js";
import { ReplayEventNode } from "./replay-events.js";
import { CombatantContext } from "../combatant-context/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { Milliseconds } from "../primatives/index.js";

export class SequentialActionExecutionManager {
  private remainingActionsToExecute: CombatActionExecutionIntent[];
  private currentTracker: null | ActionExecutionTracker = null;
  private completedTrackers: ActionExecutionTracker[] = [];
  constructor(
    public id: string,
    actionExecutionIntent: CombatActionExecutionIntent,
    public replayNode: ReplayEventNode,
    public combatantContext: CombatantContext,
    public sequentialActionManagerRegistry: SequentialActionExecutionManagerRegistry,
    private trackerThatSpawnedThisActionOption: null | ActionExecutionTracker
  ) {
    this.remainingActionsToExecute = [actionExecutionIntent];
  }
  getNextActionInQueue() {
    return this.remainingActionsToExecute[this.remainingActionsToExecute.length - 1];
  }
  getCurrentTracker() {
    return this.currentTracker;
  }
  clearCurrentAction() {
    if (this.currentTracker) this.completedTrackers.push(this.currentTracker);
    this.currentTracker = null;
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

  startProcessingNext(time: { ms: Milliseconds }): Error | ActionExecutionTracker {
    const nextActionExecutionIntentOption = this.remainingActionsToExecute.pop();
    if (!nextActionExecutionIntentOption)
      return new Error("Tried to process next action but there wasn't one");

    const { actionName, targets } = nextActionExecutionIntentOption;
    console.log(`next action option: ${COMBAT_ACTION_NAME_STRINGS[actionName]}`);

    let previousTrackerOption = null;
    if (this.trackerThatSpawnedThisActionOption) {
      previousTrackerOption = this.trackerThatSpawnedThisActionOption;
      this.trackerThatSpawnedThisActionOption = null;
    } else {
      previousTrackerOption = this.completedTrackers[this.completedTrackers.length - 1];
    }

    try {
      const tracker = new ActionExecutionTracker(
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
