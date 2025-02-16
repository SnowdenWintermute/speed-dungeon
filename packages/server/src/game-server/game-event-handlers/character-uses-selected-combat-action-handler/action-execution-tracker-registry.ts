import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionTracker,
  COMBAT_ACTION_NAME_STRINGS,
} from "@speed-dungeon/common";

export class ActionExecutionTrackerRegistry {
  trackers: { [id: string]: ActionTracker } = {};
  completed: { [id: string]: ActionTracker } = {};
  constructor() {}
  isNotEmpty() {
    return !!this.getTrackers().length;
  }
  registerTracker(tracker: ActionTracker) {
    this.trackers[tracker.id] = tracker;
  }
  unRegisterTracker(id: string) {
    const tracker = this.trackers[id];
    if (!tracker) return;
    this.completed[id] = tracker;
    delete this.trackers[id];

    console.log(
      `UNREGISTERED ${COMBAT_ACTION_NAME_STRINGS[tracker.actionExecutionIntent.actionName]}`
    );
  }
  getTrackers() {
    return Object.values(this.trackers);
  }
  getShortestTimeToCompletion(): number {
    // @TODO @PERF - check if a minHeap has better performance
    let msToTick;
    let stepName;
    for (const tracker of this.getTrackers()) {
      const timeToCompletion = tracker.currentStep?.getTimeToCompletion() || 0;
      if (msToTick === undefined) msToTick = timeToCompletion;
      else if (msToTick > timeToCompletion) {
        msToTick = timeToCompletion;
      }
      stepName = ACTION_RESOLUTION_STEP_TYPE_STRINGS[tracker.currentStep.type];
    }
    // console.log("msToTick", stepName, msToTick);
    return msToTick || 0;
  }
}
