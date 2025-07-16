import { CombatantTurnTracker, ConditionTurnTracker } from "@speed-dungeon/common";
import React from "react";
import TurnOrderTrackerIcon from "./TurnTrackerIcon";

interface Props {
  trackers: (CombatantTurnTracker | ConditionTurnTracker)[];
}

export default function TurnPredictionOrderBar(props: Props) {
  return (
    <div className="flex h-full items-center">
      <div className="h-full mr-2 flex items-center">Turn order: </div>
      {props.trackers.map((tracker) => (
        <TurnOrderTrackerIcon key={tracker.getId()} tracker={tracker} />
      ))}
    </div>
  );
}
