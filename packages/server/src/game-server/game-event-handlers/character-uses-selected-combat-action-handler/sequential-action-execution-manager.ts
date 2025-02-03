import {
  ActionExecutionTracker,
  CombatActionExecutionIntent,
  Milliseconds,
  ReplayEventNode,
  SequentialIdGenerator,
  CombatantContext,
  COMBAT_ACTION_NAME_STRINGS,
  ERROR_MESSAGES,
  COMBAT_ACTIONS,
} from "@speed-dungeon/common";
import { SequentialActionExecutionManagerRegistry } from "./sequential-action-manager-registry.js";

export class SequentialActionExecutionManager {
  private remainingActionsToExecute: CombatActionExecutionIntent[];
  private actionInProgress: null | CombatActionExecutionIntent = null;
  private currentTracker: null | ActionExecutionTracker = null;
  private completedTrackers: ActionExecutionTracker[] = [];
  constructor(
    public id: string,
    actionExecutionIntent: CombatActionExecutionIntent,
    public replayNode: ReplayEventNode,
    public combatantContext: CombatantContext,
    private sequentialActionManagerRegistry: SequentialActionExecutionManagerRegistry,
    private trackerThatSpawnedThisActionOption: null | ActionExecutionTracker
  ) {
    this.remainingActionsToExecute = [actionExecutionIntent];
  }

  getCurrentAction() {
    return this.actionInProgress;
  }
  getCurrentTracker() {
    return this.currentTracker;
  }
  clearCurrentAction() {
    if (this.currentTracker) this.completedTrackers.push(this.currentTracker);
    this.actionInProgress = null;
  }

  isCurrentlyProcessing() {
    return !!this.actionInProgress;
  }
  isDoneProcessing() {
    return !this.isCurrentlyProcessing() && this.remainingActionsToExecute.length === 0;
  }
  hasExhaustedActionTree() {
    return true;
  }
  // action children may depend on the outcome of their parent so we must process their parent first
  populateSelfWithCurrentActionChildren() {
    const currentActionExecutionIntent = this.actionInProgress;
    if (!currentActionExecutionIntent || !this.currentTracker) return;
    const currentAction = COMBAT_ACTIONS[currentActionExecutionIntent.actionName];
    const childActionIntentResults = currentAction
      .getChildren(this.combatantContext, this.currentTracker)
      .map((action) => {
        console.log("getting intent for ", COMBAT_ACTION_NAME_STRINGS[action.name]);
        return {
          actionName: action.name,
          targets: action.getAutoTarget(this.combatantContext, this.currentTracker),
        };
      });

    console.log("child intent results: ", childActionIntentResults);

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

      console.log(childActionIntents);
    }

    this.remainingActionsToExecute.push(...childActionIntents);
  }

  startProcessingNext(
    idGenerator: SequentialIdGenerator,
    time: { ms: Milliseconds }
  ): Error | null | ActionExecutionTracker {
    const nextActionExecutionIntentOption = this.remainingActionsToExecute.pop();
    if (!nextActionExecutionIntentOption)
      return new Error("Tried to process next action but there wasn't one");
    const { actionName, targets } = nextActionExecutionIntentOption;

    console.log(
      `next action option: ${actionName ? COMBAT_ACTION_NAME_STRINGS[actionName] : "null"}`
    );

    this.actionInProgress = nextActionExecutionIntentOption;
    let previousTrackerOption = null;
    if (this.trackerThatSpawnedThisActionOption) {
      previousTrackerOption = this.trackerThatSpawnedThisActionOption;
      this.trackerThatSpawnedThisActionOption = null;
    } else {
      previousTrackerOption = this.completedTrackers[this.completedTrackers.length - 1];
    }

    const action = COMBAT_ACTIONS[actionName];
    // in the case of sub-actions, we'll start with spawning the projectiles or vfx
    // otherwise start with the combatant moving
    const firstStepResult = action.getFirstResolutionStep(
      this.combatantContext,
      nextActionExecutionIntentOption,
      previousTrackerOption || null
    );
    if (firstStepResult instanceof Error) return firstStepResult;
    if (firstStepResult === null) return null;

    const tracker = new ActionExecutionTracker(
      idGenerator.getNextId(),
      nextActionExecutionIntentOption,
      previousTrackerOption || null,
      time.ms,
      this.combatantContext,
      this.replayNode,
      this.id,
      firstStepResult
    );

    if (previousTrackerOption) tracker.setPreviousTrackerInSequence(previousTrackerOption);

    this.currentTracker = tracker;

    return tracker;
  }
}
