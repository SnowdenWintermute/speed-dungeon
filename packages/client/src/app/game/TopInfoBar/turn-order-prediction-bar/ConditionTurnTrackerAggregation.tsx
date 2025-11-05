import { ConditionTurnTracker } from "@speed-dungeon/common";
import React from "react";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { CONDITION_INDICATOR_ICONS } from "@/app/icons";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";

export const ConditionTurnTrackerAggregation = observer(
  ({ trackers }: { trackers: ConditionTurnTracker[] }) => {
    const party = AppStore.get().gameStore.getExpectedParty();

    return (
      <div
        className={`border border-slate-400 h-10 w-4 mr-2 last:mr-0 flex flex-col justify-center p-[2px]`}
      >
        {trackers.map((tracker, i) => {
          try {
            const condition = tracker.getCondition(party);

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
          } catch {
            return (
              <div key={tracker.getTaggedIdOfTrackedEntity().conditionId + i} className="invisible">
                this should only show for a short time before the tracker is removed in the update
                step, but we need to not remove it yet since we're going to add delay to it for its
                turn, otherwise it will add delay to the next actor's scheduler
              </div>
            );
          }
        })}
      </div>
    );
  }
);
