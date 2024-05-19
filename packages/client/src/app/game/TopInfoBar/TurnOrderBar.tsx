import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import getGameAndParty from "@/utils/getGameAndParty";
import { Battle } from "@speed-dungeon/common";
import React, { useState } from "react";

interface Props {
  battle: Battle;
}

export default function TurnOrderBar(props: Props) {
  return props.battle.turnTrackers.map((tracker) => (
    <TurnOrderTrackerIcon entityId={tracker.entityId} />
  ));
}

const SHOWN_CLASSES = "w-10 mr-2 last:mr-0";

function TurnOrderTrackerIcon(props: { entityId: string }) {
  const gameOption = useGameStore().game;
  const usernameOption = useLobbyStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (typeof result === "string") return <div>{result}</div>;
  const [game, party] = result;
  let [preRemovalClassesState, _setPreRemovalClassesState] = useState(SHOWN_CLASSES);
  let [transitionStyle, _setTransitionStyle] = useState({ transition: "width 1s" });

  const combatantIsAlly = party.characterPositions.includes(props.entityId);
  const combatantOption = game.getCombatantById(props.entityId);
  if (!combatantOption) return <div>Error - no entity found</div>;
  const [entityProperties, _] = combatantOption;

  const conditionalClasses = combatantIsAlly ? "bg-emerald-900" : "bg-amber-900";

  function handleClick() {
    //
  }

  return (
    <button
      className={`border border-slate-400 h-10 ${conditionalClasses} mr-2 last:mr-0 ${preRemovalClassesState}`}
      style={transitionStyle}
      onClick={handleClick}
    >
      <div className="h-full w-full rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        {entityProperties.name.charAt(0).toUpperCase()}
      </div>
    </button>
  );
}
