import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { ACTION_ENTITY_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionEntityTurnTracker } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";

const SHOWN_CLASSES = "mr-2 last:mr-0";

export const ActionEntityTurnOrderTrackerIcon = observer(
  ({ tracker }: { tracker: ActionEntityTurnTracker }) => {
    const party = AppStore.get().gameStore.getExpectedParty();

    let [preRemovalClassesState, _setPreRemovalClassesState] = useState(SHOWN_CLASSES);
    let [transitionStyle, _setTransitionStyle] = useState({ transition: "width 1s" });

    const taggedTrackedEntityId = tracker.getTaggedIdOfTrackedEntity();

    const conditionalClasses = "";

    let icon = (
      <div className="h-full w-full rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <span className="h-full w-full">
          <div>{taggedTrackedEntityId.actionEntityId.slice(0, 2).toUpperCase()}</div>;
        </span>
      </div>
    );

    const { actionEntityManager } = party;
    const actionEnityResult = actionEntityManager.getActionEntityOption(
      taggedTrackedEntityId.actionEntityId
    );

    if (actionEnityResult !== undefined) {
      const iconGetterOption = ACTION_ENTITY_ICONS[actionEnityResult.actionEntityProperties.name];
      if (iconGetterOption !== null) {
        icon = (
          <div className="p-1 filter brightness-125 contrast-50">{iconGetterOption("h-full")}</div>
        );
      }
    }

    return (
      <button
        className={`border border-slate-400 h-10 w-10 ${conditionalClasses} mr-2 last:mr-0 ${preRemovalClassesState}`}
        style={transitionStyle}
      >
        <HoverableTooltipWrapper
          tooltipText={tracker.timeOfNextMove.toString()}
          extraStyles="h-full w-full"
        >
          {icon}
        </HoverableTooltipWrapper>
      </button>
    );
  }
);
