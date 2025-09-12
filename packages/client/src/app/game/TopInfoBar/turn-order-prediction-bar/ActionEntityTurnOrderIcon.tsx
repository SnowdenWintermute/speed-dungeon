import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { useGameStore } from "@/stores/game-store";
import getGameAndParty from "@/utils/getGameAndParty";
import { ActionEntityTurnTracker } from "@speed-dungeon/common";
import React, { useState } from "react";

const SHOWN_CLASSES = "mr-2 last:mr-0";

export default function ActionEntityTurnOrderTrackerIcon({
  tracker,
}: {
  tracker: ActionEntityTurnTracker;
}) {
  const gameOption = useGameStore().game;
  const usernameOption = useGameStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;
  let [preRemovalClassesState, _setPreRemovalClassesState] = useState(SHOWN_CLASSES);
  let [transitionStyle, _setTransitionStyle] = useState({ transition: "width 1s" });

  const taggedTrackedEntityId = tracker.getTaggedIdOfTrackedEntity();

  function handleClick() {
    //
  }

  const conditionalClasses = "";

  const icon = <div>{taggedTrackedEntityId.actionEntityId.slice(0, 2).toUpperCase()}</div>;

  return (
    <button
      className={`border border-slate-400 h-10 w-10 ${conditionalClasses} mr-2 last:mr-0 ${preRemovalClassesState}`}
      style={transitionStyle}
      onClick={handleClick}
    >
      <HoverableTooltipWrapper
        tooltipText={tracker.timeOfNextMove.toString()}
        extraStyles="h-full w-full"
      >
        <div className="h-full w-full rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
          <span className="h-full w-full">{icon}</span>
        </div>
      </HoverableTooltipWrapper>
    </button>
  );
}
