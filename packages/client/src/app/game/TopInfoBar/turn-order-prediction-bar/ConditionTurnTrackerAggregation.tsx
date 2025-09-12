import { useGameStore } from "@/stores/game-store";
import { ConditionTurnTracker } from "@speed-dungeon/common";
import React from "react";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { CONDITION_INDICATOR_ICONS } from "@/app/icons";

export default function ConditionTurnTrackerAggregation({
  trackers,
}: {
  trackers: ConditionTurnTracker[];
}) {
  const partyResult = useGameStore.getState().getParty();
  if (partyResult instanceof Error) throw partyResult;

  return (
    <div
      className={`border border-slate-400 h-10 w-4 mr-2 last:mr-0 flex flex-col justify-center p-[2px]`}
    >
      {trackers.map((tracker, i) => {
        const condition = tracker.getCondition(partyResult);

        return (
          <button className="" key={tracker.getTaggedIdOfTrackedEntity().conditionId + i}>
            <HoverableTooltipWrapper
              tooltipText={tracker.timeOfNextMove.toString()}
              extraStyles="h-full w-full"
            >
              {CONDITION_INDICATOR_ICONS[condition.name]}{" "}
            </HoverableTooltipWrapper>
          </button>
        );
      })}
    </div>
  );
}
