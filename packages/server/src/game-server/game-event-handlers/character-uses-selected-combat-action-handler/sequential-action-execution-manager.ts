import {
  ActionExecutionTracker,
  COMBAT_ACTIONS,
  CombatActionComponent,
  CombatActionExecutionIntent,
  Milliseconds,
  ReplayEventNode,
  SequentialIdGenerator,
  CombatantContext,
  COMBAT_ACTION_NAME_STRINGS,
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  EntityId,
  ERROR_MESSAGES,
  CombatActionTarget,
} from "@speed-dungeon/common";
import { idGenerator } from "../../../singletons.js";
import { number } from "zod";

class SequentialActionExecutionManagerRegistry {
  private actionManagers: { [id: string]: SequentialActionExecutionManager } = {};
  constructor() {}
  isEmpty() {
    return !Object.values(this.actionManagers).length;
  }
  isNotEmpty() {
    return !this.isEmpty();
  }
  registerAction(
    actionExecutionIntent: CombatActionExecutionIntent,
    replayNode: ReplayEventNode,
    combatantContext: CombatantContext
  ) {
    const id = idGenerator.generate();
    const manager = new SequentialActionExecutionManager(
      id,
      actionExecutionIntent,
      replayNode,
      combatantContext,
      this
    );
    this.actionManagers[id] = manager;
    return manager;
  }
  getManager(id: EntityId) {
    return this.actionManagers[id];
  }
  unRegisterAction(id: string) {
    delete this.actionManagers[id];
  }
  getManagers() {
    return Object.entries(this.actionManagers);
  }
}

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
    private sequentialActionManagerRegistry: SequentialActionExecutionManagerRegistry
  ) {
    this.remainingActionsToExecute = [actionExecutionIntent];
  }

  getCurrentAction() {
    return this.actionInProgress;
  }
  clearCurrentAction() {
    if (this.currentTracker) this.completedTrackers.push(this.currentTracker);
    console.log("ACTION CLEARED, COMPLETED TRACKERS", this.completedTrackers);
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
        return { actionName: action.name, targets: action.getAutoTarget(this.combatantContext) };
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

    this.remainingActionsToExecute.push(...childActionIntents);
  }

  startProcessingNext(
    idGenerator: SequentialIdGenerator,
    time: { ms: Milliseconds }
  ): ActionExecutionTracker {
    const nextActionExecutionIntentOption = this.remainingActionsToExecute.pop();
    if (!nextActionExecutionIntentOption)
      throw new Error("Tried to process next action but there wasn't one");
    const { actionName, targets } = nextActionExecutionIntentOption;
    console.log(
      `next action option: ${actionName ? COMBAT_ACTION_NAME_STRINGS[actionName] : "null"}`
    );

    this.actionInProgress = nextActionExecutionIntentOption;
    console.log("COMPLETED TRACKERS: ", this.completedTrackers);
    const previousTrackerOption = this.completedTrackers[this.completedTrackers.length - 1];

    const tracker = new ActionExecutionTracker(
      idGenerator.getNextId(),
      nextActionExecutionIntentOption,
      this.currentTracker,
      time.ms,
      this.combatantContext,
      this.replayNode,
      this.id
    );

    if (previousTrackerOption) tracker.setPreviousTrackerInSequence(previousTrackerOption);

    this.currentTracker = tracker;

    return tracker;
  }
}

class ActionExecutionTrackerRegistry {
  trackers: { [id: string]: ActionExecutionTracker } = {};
  completed: { [id: string]: ActionExecutionTracker } = {};
  constructor() {}
  isNotEmpty() {
    return !!this.getTrackers().length;
  }
  registerTracker(tracker: ActionExecutionTracker) {
    this.trackers[tracker.id] = tracker;
  }
  unRegisterTracker(id: string) {
    const tracker = this.trackers[id];
    if (!tracker) return;
    this.completed[id] = tracker;
    delete this.trackers[id];
  }
  getTrackers() {
    return Object.values(this.trackers);
  }
  getShortestTimeToCompletion(): number {
    console.log("getting shortest");
    // @TODO @PERF - check if a minHeap has better performance
    let msToTick;
    for (const tracker of this.getTrackers()) {
      const timeToCompletion = tracker.currentStep.getTimeToCompletion();
      console.log(
        "tracker for",
        COMBAT_ACTION_NAME_STRINGS[tracker.actionExecutionIntent.actionName],
        ACTION_RESOLUTION_STEP_TYPE_STRINGS[tracker.currentStep.type],
        timeToCompletion
      );
      if (msToTick === undefined) msToTick = timeToCompletion;
      else if (msToTick > timeToCompletion) {
        msToTick = timeToCompletion;
      }
    }
    console.log("msToTick", msToTick);
    return msToTick || 0;
  }
}

export function processCombatAction(
  actionExecutionIntent: CombatActionExecutionIntent,
  combatantContext: CombatantContext
) {
  const sequentialActionManagerRegistry = new SequentialActionExecutionManagerRegistry();
  const rootReplayNode = new ReplayEventNode();
  sequentialActionManagerRegistry.registerAction(
    actionExecutionIntent,
    rootReplayNode,
    combatantContext
  );
  const actionExecutionTrackerRegistry = new ActionExecutionTrackerRegistry();

  const time = { ms: 0 };
  const actionStepIdGenerator = new SequentialIdGenerator();
  const completionOrderIdGenerator = new SequentialIdGenerator();

  console.log(sequentialActionManagerRegistry.getManagers());

  let looplimit = 30;
  let currloop = 0;

  while (
    (sequentialActionManagerRegistry.isNotEmpty() || actionExecutionTrackerRegistry.isNotEmpty()) &&
    currloop < looplimit
  ) {
    currloop++;
    console.log("curr loop outer: ", currloop, looplimit);
    console.log(
      "sequential action managers ",
      sequentialActionManagerRegistry.getManagers().map(([id, manager]) => {
        const actionOption = manager.getCurrentAction();
        if (actionOption) return COMBAT_ACTION_NAME_STRINGS[actionOption.actionName];
        else return null;
      })
    );
    console.log(
      "action execution trackers ",
      actionExecutionTrackerRegistry.getTrackers().map((i) => i)
    );
    for (const [id, manager] of sequentialActionManagerRegistry.getManagers()) {
      console.log("action manager isDoneProcessing", manager.isDoneProcessing());
      if (manager.isDoneProcessing()) {
        manager.populateSelfWithCurrentActionChildren();
        if (manager.hasExhaustedActionTree()) {
          sequentialActionManagerRegistry.unRegisterAction(id);
          continue;
        }
      }
      if (manager.isDoneProcessing() || manager.isCurrentlyProcessing()) continue;

      const tracker = manager.startProcessingNext(actionStepIdGenerator, time);

      const gameUpdateCommandStarted = tracker.currentStep.getGameUpdateCommand();
      manager.replayNode.events.push(gameUpdateCommandStarted);
      actionExecutionTrackerRegistry.registerTracker(tracker);
    }

    // tick active ActionExecutionTrackers
    const timeToTick = actionExecutionTrackerRegistry.getShortestTimeToCompletion();

    const trackers = actionExecutionTrackerRegistry.getTrackers();
    for (const tracker of trackers) tracker.currentStep.tick(timeToTick);
    time.ms += timeToTick;
    // we must either sort and process by shortest time to complete, or loop twice
    // so we can be assured that all trackers who's completion may have been triggered
    // by the effects of the shortestTimeToCompletion tracker are taken into account
    for (const tracker of trackers) {
      if (!tracker.currentStep.isComplete()) continue;

      // process all instantly processable steps

      let looplimit = 30;
      let currloop = 0;
      while (tracker.currentStep.isComplete() && currloop < looplimit) {
        const { nextStepOption, branchingActions } = tracker.currentStep.finalize(
          completionOrderIdGenerator.getNextIdNumeric()
        );
        currloop += 1;
        console.log("currloop: ", currloop, looplimit);

        tracker.storeCompletedStep();

        for (const { user, actionExecutionIntent } of branchingActions) {
          const nestedReplayNode = new ReplayEventNode();
          tracker.replayNode.events.push(nestedReplayNode);

          // branching actions may have a different user than the triggering action
          const nestedCombatantContext = new CombatantContext(
            combatantContext.game,
            combatantContext.party,
            user
          );
          sequentialActionManagerRegistry.registerAction(
            actionExecutionIntent,
            nestedReplayNode,
            nestedCombatantContext
          );
        }

        if (nextStepOption === null) {
          actionExecutionTrackerRegistry.unRegisterTracker(tracker.id);
          const actionManagerOption = sequentialActionManagerRegistry.getManager(
            tracker.sequentialActionManagerId
          );
          if (actionManagerOption) actionManagerOption.clearCurrentAction();
          console.log("UNREGISTERED");
          break;
        } else {
          const gameUpdateCommandStarted = tracker.currentStep.getGameUpdateCommand();
          tracker.replayNode.events.push(gameUpdateCommandStarted);
          tracker.currentStep = nextStepOption;
        }
      }
    }
  }

  return rootReplayNode;
}
