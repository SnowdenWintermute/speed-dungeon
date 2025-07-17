import { CombatantTurnTracker, ConditionTurnTracker } from "@speed-dungeon/common";
import React from "react";
import TurnOrderTrackerIcon from "./TurnTrackerIcon";
import ConditionTurnTrackerAggregation from "./ConditionTurnTrackerAggregation";

interface Props {
  trackers: (CombatantTurnTracker | ConditionTurnTracker)[];
}

export default function TurnPredictionOrderBar({ trackers }: Props) {
  // aggregate here
  const listWithAggregatedSequentialConditionTrackers: (
    | CombatantTurnTracker
    | ConditionTurnTracker[]
  )[] = [];

  let trackerIndex = 0;
  let currentTracker = trackers[trackerIndex];
  while (trackerIndex < trackers.length) {
    if (currentTracker instanceof CombatantTurnTracker) {
      listWithAggregatedSequentialConditionTrackers.push(currentTracker);
      trackerIndex += 1;
      currentTracker = trackers[trackerIndex];
    } else if (currentTracker instanceof ConditionTurnTracker) {
      trackerIndex += 1;
      let nextTracker = trackers[trackerIndex];
      let sequentialConditionTurnTrackers: ConditionTurnTracker[] = [currentTracker];
      while (nextTracker && nextTracker instanceof ConditionTurnTracker) {
        sequentialConditionTurnTrackers.push(nextTracker);
        trackerIndex += 1;
        nextTracker = trackers[trackerIndex];
      }
      listWithAggregatedSequentialConditionTrackers.push(sequentialConditionTurnTrackers);
      currentTracker = nextTracker;
    } else {
      throw new Error("infinite loop stopped");
    }
  }

  return (
    <div className="flex h-full items-center">
      <div className="h-full mr-2 flex items-center">Turn order: </div>
      {listWithAggregatedSequentialConditionTrackers.map((tracker, i) => {
        if (tracker instanceof CombatantTurnTracker)
          return <TurnOrderTrackerIcon key={tracker.getId()} tracker={tracker} />;
        else return <ConditionTurnTrackerAggregation key={i} trackers={tracker} />;
      })}
    </div>
  );
}
