import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { useGameStore } from "@/stores/game-store";
import { getCombatantUiIdentifierIcon } from "@/utils/get-combatant-class-icon";
import getGameAndParty from "@/utils/getGameAndParty";
import {
  AdventuringParty,
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantTurnTracker,
  ConditionTurnTracker,
} from "@speed-dungeon/common";
import React, { useState } from "react";

const SHOWN_CLASSES = "mr-2 last:mr-0";

export default function TurnOrderTrackerIcon({
  tracker,
}: {
  tracker: CombatantTurnTracker | ConditionTurnTracker;
}) {
  const gameOption = useGameStore().game;
  const usernameOption = useGameStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;
  let [preRemovalClassesState, _setPreRemovalClassesState] = useState(SHOWN_CLASSES);
  let [transitionStyle, _setTransitionStyle] = useState({ transition: "width 1s" });

  const isCondition = tracker instanceof ConditionTurnTracker;
  const combatantIsAlly = party.characterPositions.includes(tracker.combatantId);

  const conditionalClasses = isCondition
    ? "bg-slate-600"
    : combatantIsAlly
      ? "bg-emerald-900"
      : "bg-amber-900";

  const name: string = (() => {
    if (tracker instanceof ConditionTurnTracker)
      return COMBATANT_CONDITION_NAME_STRINGS[tracker.getCondition(party).name]
        .slice(0, 2)
        .toUpperCase();
    else {
      return tracker.getCombatant(party).entityProperties.name.slice(0, 2).toUpperCase();
    }
  })();

  function handleClick() {
    //
  }

  const combatant = AdventuringParty.getExpectedCombatant(party, tracker.combatantId);
  const combatantUiIdentifierIcon = getCombatantUiIdentifierIcon(party, combatant);

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
          <span className="h-full w-full">{combatantUiIdentifierIcon}</span>
        </div>
      </HoverableTooltipWrapper>
    </button>
  );
}
