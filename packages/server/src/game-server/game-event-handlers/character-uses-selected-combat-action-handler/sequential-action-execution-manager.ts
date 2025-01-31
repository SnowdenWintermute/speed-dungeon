import {
  ActionExecutionTracker,
  COMBAT_ACTIONS,
  CombatActionComponent,
  CombatActionExecutionIntent,
  CombatantAssociatedData,
  Milliseconds,
  ReplayEventNode,
  SequentialIdGenerator,
} from "@speed-dungeon/common";
import { idGenerator } from "../../../singletons";

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
    combatantContext: CombatantAssociatedData
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
  constructor(
    public id: string,
    action: CombatActionComponent,
    public replayNode: ReplayEventNode,
    public combatantContext: CombatantAssociatedData,
    private sequentialActionManagerRegistry: SequentialActionExecutionManagerRegistry
  ) {
    this.remainingActionsToExecute = [
      action,
      ...action.getChildrenRecursive(combatantContext.combatant),
    ].reverse();
  }

  isCurrentlyProcessing() {
    return !!this.actionInProgress;
  }
  isDoneProcessing() {
    return !this.isCurrentlyProcessing() && this.remainingActionsToExecute.length === 0;
  }

  startProcessingNext(
    idGenerator: SequentialIdGenerator,
    time: { ms: Milliseconds }
  ): ActionExecutionTracker | CombatActionComponent[] {
    const nextActionOption = this.remainingActionsToExecute.pop();
    if (!nextActionOption) throw new Error("Tried to process next action but there wasn't one");
    const targets = nextActionOption.getAutoTarget(this.combatantContext);
    if (targets instanceof Error) throw targets;
    if (!targets) throw new Error("Auto target returned null");

    const subActions = nextActionOption.getConcurrentSubActions();
    if (subActions.length) return subActions;

    const tracker = new ActionExecutionTracker(
      idGenerator.getNextId(),
      new CombatActionExecutionIntent(nextActionOption.name, targets),
      time.ms,
      this.combatantContext,
      this.replayNode
    );

    return tracker;
  }
}

class ActionExecutionTrackerRegistry {
  trackers: { [id: string]: ActionExecutionTracker } = {};
  constructor() {}
  isNotEmpty() {
    return !!this.getTrackers().length;
  }
  registerTracker(tracker: ActionExecutionTracker) {
    this.trackers[tracker.id] = tracker;
  }
  unRegisterTracker(id: string) {
    delete this.trackers[id];
  }
  getTrackers() {
    return Object.entries(this.trackers);
  }
  getShortestTimeToCompletion(): number {
    let msToTick;
    for (const [id, tracker] of this.getTrackers()) {
      const timeToCompletion = tracker.currentStep.getTimeToCompletion();
      if (msToTick === undefined) msToTick = timeToCompletion;
      else if (msToTick > timeToCompletion) {
        msToTick = timeToCompletion;
      }
    }
    return msToTick || 0;
  }
}

function processCombatAction(
  action: CombatActionComponent,
  combatantContext: CombatantAssociatedData
) {
  const sequentialActionManagerRegistry = new SequentialActionExecutionManagerRegistry();
  const rootReplayNode = new ReplayEventNode();
  sequentialActionManagerRegistry.registerAction(action, rootReplayNode, combatantContext);
  const actionExecutionTrackerRegistry = new ActionExecutionTrackerRegistry();

  const time = { ms: 0 };
  const actionStepIdGenerator = new SequentialIdGenerator();
  const completionOrderIdGenerator = new SequentialIdGenerator();

  while (sequentialActionManagerRegistry.isNotEmpty()) {
    for (const [id, manager] of sequentialActionManagerRegistry.getManagers()) {
      if (manager.isDoneProcessing()) sequentialActionManagerRegistry.unRegisterAction(id);
      if (manager.isCurrentlyProcessing()) continue;

      const trackerOrSubActions = manager.startProcessingNext(actionStepIdGenerator, time);

      if (trackerOrSubActions instanceof ActionExecutionTracker) {
        const gameUpdateCommandStarted = trackerOrSubActions.currentStep.getGameUpdateCommand();
        manager.replayNode.events.push(gameUpdateCommandStarted);
        actionExecutionTrackerRegistry.registerTracker(trackerOrSubActions);
      } else {
        for (const action of trackerOrSubActions) {
          const nestedReplayNode = new ReplayEventNode();

          manager.replayNode.events.push(nestedReplayNode);

          sequentialActionManagerRegistry.registerAction(
            action,
            nestedReplayNode,
            combatantContext // we can assume subActions are being used by the user of the parent action
          );
        }
      }
    }

    // tick active ActionExecutionTrackers

    while (actionExecutionTrackerRegistry.isNotEmpty()) {
      const timeToTick = actionExecutionTrackerRegistry.getShortestTimeToCompletion();
      for (const [id, tracker] of actionExecutionTrackerRegistry.getTrackers()) {
        tracker.currentStep.tick(timeToTick);
        if (!tracker.currentStep.isComplete()) continue;

        const { nextStepOption, branchingActions } = tracker.currentStep.onComplete(
          completionOrderIdGenerator.getNextIdNumeric()
        );

        for (const { user, actionExecutionIntent } of branchingActions) {
          const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
          const nestedReplayNode = new ReplayEventNode();
          tracker.replayNode.events.push(nestedReplayNode);

          // branching actions may have a different user than the triggering action
          const nestedCombatantContext = { ...combatantContext, combatant: user };
          sequentialActionManagerRegistry.registerAction(
            action,
            nestedReplayNode,
            nestedCombatantContext
          );
        }

        if (nextStepOption === null) actionExecutionTrackerRegistry.unRegisterTracker(tracker.id);
        //   - get the next ActionExecutionStep from the ActionExecutionTracker
        //   - add any initial replayEvent from the next step to the ReplayEventNode
      }
    }
  }
}
