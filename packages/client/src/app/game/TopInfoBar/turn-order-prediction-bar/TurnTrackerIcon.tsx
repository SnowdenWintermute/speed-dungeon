import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { useGameStore } from "@/stores/game-store";
import { getCombatantUiIdentifierIcon } from "@/utils/get-combatant-class-icon";
import getGameAndParty from "@/utils/getGameAndParty";
import {
  CombatantTurnTracker,
  ConditionTurnTracker,
  TurnTrackerEntityType,
} from "@speed-dungeon/common";
import React, { useState } from "react";

const SHOWN_CLASSES = "mr-2 last:mr-0";

export default function TurnOrderTrackerIcon({ tracker }: { tracker: CombatantTurnTracker }) {
  const gameOption = useGameStore().game;
  const usernameOption = useGameStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;
  let [preRemovalClassesState, _setPreRemovalClassesState] = useState(SHOWN_CLASSES);
  let [transitionStyle, _setTransitionStyle] = useState({ transition: "width 1s" });

  const taggedTrackedEntityId = tracker.getTaggedIdOfTrackedEntity();

  const isCondition = tracker instanceof ConditionTurnTracker;

  const combatantIsAlly =
    taggedTrackedEntityId.type === TurnTrackerEntityType.Combatant &&
    party.characterPositions.includes(taggedTrackedEntityId.combatantId);

  const conditionalClasses = isCondition
    ? "bg-slate-600"
    : combatantIsAlly
      ? "bg-emerald-900"
      : "bg-amber-900";

  let combatantOption;

  const name: string = (() => {
    const combatant = party.combatantManager.getExpectedCombatant(
      taggedTrackedEntityId.combatantId
    );
    combatantOption = combatant;
    return combatant.entityProperties.name.slice(0, 2).toUpperCase();
  })();

  function handleClick() {
    //
  }

  const combatantUiIdentifierIcon = getCombatantUiIdentifierIcon(party, combatantOption);

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
