import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { useGameStore } from "@/stores/game-store";
import { getCombatantUiIdentifierIcon } from "@/utils/get-combatant-class-icon";
import getGameAndParty from "@/utils/getGameAndParty";
import {
  AdventuringParty,
  COMBATANT_CONDITION_NAME_STRINGS,
  CombatantTurnTracker,
  ConditionTurnTracker,
  TurnTracker,
  TurnTrackerEntityType,
} from "@speed-dungeon/common";
import React, { useState } from "react";

const SHOWN_CLASSES = "mr-2 last:mr-0";

export default function TurnOrderTrackerIcon({ tracker }: { tracker: TurnTracker }) {
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
    switch (taggedTrackedEntityId.type) {
      case TurnTrackerEntityType.Combatant:
        const combatant = AdventuringParty.getExpectedCombatant(
          party,
          taggedTrackedEntityId.combatantId
        );
        combatantOption = combatant;
        return combatant.entityProperties.name.slice(0, 2).toUpperCase();
      case TurnTrackerEntityType.Condition:
        const conditionResult = AdventuringParty.getConditionOnCombatant(
          party,
          taggedTrackedEntityId.combatantId,
          taggedTrackedEntityId.conditionId
        );
        if (conditionResult instanceof Error) throw conditionResult;
        return COMBATANT_CONDITION_NAME_STRINGS[conditionResult.name].slice(0, 2).toUpperCase();
      case TurnTrackerEntityType.ActionEntity:
        const actionEntityOption = party.actionEntities[taggedTrackedEntityId.actionEntityId];
        if (actionEntityOption === undefined) throw new Error("expected action enitity not found");
        return actionEntityOption.entityProperties.name;
    }
  })();

  function handleClick() {
    //
  }

  let combatantUiIdentifierIcon = <></>;
  if (combatantOption)
    combatantUiIdentifierIcon = getCombatantUiIdentifierIcon(party, combatantOption);

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
