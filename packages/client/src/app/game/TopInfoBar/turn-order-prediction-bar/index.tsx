import {
  ActionEntityTurnTracker,
  CombatantTurnTracker,
  ConditionTurnTracker,
} from "@speed-dungeon/common";
import React from "react";
import TurnOrderTrackerIcon from "./TurnTrackerIcon";
import ConditionTurnTrackerAggregation from "./ConditionTurnTrackerAggregation";

import ClockIcon from "../../../../../public/img/game-ui-icons/clock-icon.svg";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import ActionEntityTurnOrderTrackerIcon from "./ActionEntityTurnOrderIcon";

interface Props {
  trackers: (CombatantTurnTracker | ConditionTurnTracker)[];
}

export default function TurnPredictionOrderBar({ trackers }: Props) {
  // aggregate here
  const listWithAggregatedSequentialConditionTrackers: (
    | CombatantTurnTracker
    | ActionEntityTurnTracker
    | ConditionTurnTracker[]
  )[] = [];

  let trackerIndex = 0;
  let currentTracker = trackers[trackerIndex];
  while (trackerIndex < trackers.length) {
    if (
      currentTracker instanceof CombatantTurnTracker ||
      currentTracker instanceof ActionEntityTurnTracker
    ) {
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
      <HoverableTooltipWrapper tooltipText="Predicted turn order">
        <div className="h-8 py-1 mr-2 flex items-center">
          <ClockIcon className="fill-slate-400 h-full" />
        </div>
      </HoverableTooltipWrapper>
      {listWithAggregatedSequentialConditionTrackers.map((tracker, i) => {
        if (tracker instanceof CombatantTurnTracker)
          return <TurnOrderTrackerIcon key={tracker.getId() + i} tracker={tracker} />;
        else if (tracker instanceof ActionEntityTurnTracker) {
          return <ActionEntityTurnOrderTrackerIcon key={tracker.getId()} tracker={tracker} />;
        } else return <ConditionTurnTrackerAggregation key={i} trackers={tracker} />;
      })}
    </div>
  );
}
