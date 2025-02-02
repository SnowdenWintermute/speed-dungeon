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
} from "@speed-dungeon/common";
import { idGenerator } from "../../../singletons.js";

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
    action: CombatActionComponent,
    replayNode: ReplayEventNode,
    combatantContext: CombatantContext
  ) {
    const id = idGenerator.generate();
    const manager = new SequentialActionExecutionManager(
      id,
      action,
      replayNode,
      combatantContext,
      this
    );
    this.actionManagers[id] = manager;
    return manager;
  }
  unRegisterAction(id: string) {
    delete this.actionManagers[id];
  }
  getManagers() {
    return Object.entries(this.actionManagers);
  }
}

export class SequentialActionExecutionManager {
  private remainingActionsToExecute: CombatActionComponent[];
  private actionInProgress: null | CombatActionComponent = null;
  private currentTracker: null | ActionExecutionTracker = null;
  constructor(
    public id: string,
    action: CombatActionComponent,
    public replayNode: ReplayEventNode,
    public combatantContext: CombatantContext,
    private sequentialActionManagerRegistry: SequentialActionExecutionManagerRegistry
  ) {
    this.remainingActionsToExecute = [action];
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
    const currentAction = this.actionInProgress;
    if (!currentAction || !this.currentTracker) return;
    const children = currentAction.getChildren(this.combatantContext, this.currentTracker);
    this.remainingActionsToExecute.push(...children);
  }

  startProcessingNext(
    idGenerator: SequentialIdGenerator,
    time: { ms: Milliseconds }
  ): ActionExecutionTracker {
    const nextActionOption = this.remainingActionsToExecute.pop();
    console.log(
      "next action option: ",
      nextActionOption?.name ? COMBAT_ACTION_NAME_STRINGS[nextActionOption.name] : "null"
    );
    if (!nextActionOption) throw new Error("Tried to process next action but there wasn't one");

    this.actionInProgress = nextActionOption;
    const targets = nextActionOption.getAutoTarget(this.combatantContext);
    if (targets instanceof Error) throw targets;
    if (!targets) throw new Error("Auto target returned null");

    const tracker = new ActionExecutionTracker(
      idGenerator.getNextId(),
      new CombatActionExecutionIntent(nextActionOption.name, targets),
      this.currentTracker,
      time.ms,
      this.combatantContext,
      this.replayNode
    );

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
  action: CombatActionComponent,
  combatantContext: CombatantContext
) {
  const sequentialActionManagerRegistry = new SequentialActionExecutionManagerRegistry();
  const rootReplayNode = new ReplayEventNode();
  sequentialActionManagerRegistry.registerAction(action, rootReplayNode, combatantContext);
  const actionExecutionTrackerRegistry = new ActionExecutionTrackerRegistry();

  const time = { ms: 0 };
  const actionStepIdGenerator = new SequentialIdGenerator();
  const completionOrderIdGenerator = new SequentialIdGenerator();

  console.log(sequentialActionManagerRegistry.getManagers());

  while (
    sequentialActionManagerRegistry.isNotEmpty() ||
    actionExecutionTrackerRegistry.isNotEmpty()
  ) {
    console.log("sequenial action manager registry loop");
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
      while (tracker.currentStep.isComplete()) {
        const { nextStepOption, branchingActions } = tracker.currentStep.finalize(
          completionOrderIdGenerator.getNextIdNumeric()
        );

        tracker.storeCompletedStep();

        for (const { user, actionExecutionIntent } of branchingActions) {
          const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
          const nestedReplayNode = new ReplayEventNode();
          tracker.replayNode.events.push(nestedReplayNode);

          // branching actions may have a different user than the triggering action
          const nestedCombatantContext = new CombatantContext(
            combatantContext.game,
            combatantContext.party,
            user
          );
          sequentialActionManagerRegistry.registerAction(
            action,
            nestedReplayNode,
            nestedCombatantContext
          );
        }

        if (nextStepOption === null) actionExecutionTrackerRegistry.unRegisterTracker(tracker.id);
        else {
          tracker.currentStep = nextStepOption;
          const gameUpdateCommandStarted = tracker.currentStep.getGameUpdateCommand();
          tracker.replayNode.events.push(gameUpdateCommandStarted);
        }
      }
    }
  }
}
