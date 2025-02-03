import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  ActionExecutionTracker,
  COMBAT_ACTION_NAME_STRINGS,
} from "@speed-dungeon/common";

export class ActionExecutionTrackerRegistry {
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
    // @TODO @PERF - check if a minHeap has better performance
    let msToTick;
    for (const tracker of this.getTrackers()) {
      const timeToCompletion = tracker.currentStep.getTimeToCompletion();
      if (msToTick === undefined) msToTick = timeToCompletion;
      else if (msToTick > timeToCompletion) {
        msToTick = timeToCompletion;
      }
    }
    console.log("msToTick", msToTick);
    return msToTick || 0;
  }
}
