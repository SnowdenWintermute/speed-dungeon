import { useGameStore } from "@/stores/game-store";
import { ConditionTurnTracker } from "@speed-dungeon/common";
import React, { useState } from "react";
import { CONDITION_INDICATOR_ICONS } from "../../combatant-plaques/condition-indicators/condition-indicator-icons";

export default function ConditionTurnTrackerAggregation({
  trackers,
}: {
  trackers: ConditionTurnTracker[];
}) {
  const partyResult = useGameStore.getState().getParty();
  if (partyResult instanceof Error) throw partyResult;

  const [hiddenClass, setHiddenClass] = useState("hidden");
  function onMouseEnter() {
    setHiddenClass("");
  }
  function onMouseLeave() {
    setHiddenClass("hidden");
  }

  return (
    <div
      className={`border border-slate-400 h-10 w-4 mr-2 last:mr-0 flex flex-col justify-center p-[2px]`}
    >
      {trackers.map((tracker, i) => {
        const condition = tracker.getCondition(partyResult);

        return (
          <button
            className=""
            onMouseLeave={onMouseLeave}
            onMouseEnter={onMouseEnter}
            key={tracker.conditionId + i}
          >
            {CONDITION_INDICATOR_ICONS[condition.name]}{" "}
            <div className={`text-2xl absolute top-[160px] ${hiddenClass}`}>
              <div>{tracker.timeOfNextMove}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
