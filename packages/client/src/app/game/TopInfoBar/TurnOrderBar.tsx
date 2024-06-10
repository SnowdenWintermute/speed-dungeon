import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import getGameAndParty from "@/utils/getGameAndParty";
import { Battle } from "@speed-dungeon/common";
import getCombatantInGameById from "@speed-dungeon/common/src/game/get-combatant-in-game-by-id";
import React, { useState } from "react";

interface Props {
  battle: Battle;
}

export default function TurnOrderBar(props: Props) {
  return props.battle.turnTrackers.map((tracker) => (
    <TurnOrderTrackerIcon key={tracker.entityId} entityId={tracker.entityId} />
  ));
}

const SHOWN_CLASSES = "w-10 mr-2 last:mr-0";

function TurnOrderTrackerIcon(props: { entityId: string }) {
  const gameOption = useGameStore().game;
  const usernameOption = useGameStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;
  let [preRemovalClassesState, _setPreRemovalClassesState] = useState(SHOWN_CLASSES);
  let [transitionStyle, _setTransitionStyle] = useState({ transition: "width 1s" });

  const combatantIsAlly = party.characterPositions.includes(props.entityId);
  const combatantResult = getCombatantInGameById(game, props.entityId);
  if (combatantResult instanceof Error) return <div>{combatantResult.message}</div>;
  const { entityProperties, combatantProperties: _ } = combatantResult;

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
