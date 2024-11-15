import { useGameStore } from "@/stores/game-store";
import getGameAndParty from "@/utils/getGameAndParty";
import { Battle, CombatantTurnTracker, SpeedDungeonGame } from "@speed-dungeon/common";
import React, { useState } from "react";

interface Props {
  battle: Battle;
}

export default function TurnOrderBar(props: Props) {
  return props.battle.turnTrackers.map((tracker) => (
    <TurnOrderTrackerIcon key={tracker.entityId} tracker={tracker} />
  ));
}

const SHOWN_CLASSES = "w-10 mr-2 last:mr-0";

function TurnOrderTrackerIcon({ tracker }: { tracker: CombatantTurnTracker }) {
  const gameOption = useGameStore().game;
  const usernameOption = useGameStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;
  let [preRemovalClassesState, _setPreRemovalClassesState] = useState(SHOWN_CLASSES);
  let [transitionStyle, _setTransitionStyle] = useState({ transition: "width 1s" });

  const combatantIsAlly = party.characterPositions.includes(tracker.entityId);
  const combatantResult = SpeedDungeonGame.getCombatantById(game, tracker.entityId);
  if (combatantResult instanceof Error) return <div>{combatantResult.message}</div>;
  const { entityProperties, combatantProperties: _ } = combatantResult;

  const conditionalClasses = combatantIsAlly ? "bg-emerald-900" : "bg-amber-900";

  function handleClick() {
    //
  }

  return (
    <button
      className={`border border-slate-400 h-10 w-32 ${conditionalClasses} mr-2 last:mr-0 ${preRemovalClassesState}`}
      style={transitionStyle}
      onClick={handleClick}
    >
      <div className="h-full w-full rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <span className="mr-1 text-green-600">{entityProperties.name.charAt(0).toUpperCase()}</span>
        {
          // <div>{tracker.movement.toFixed(0)}</div>
        }
      </div>
    </button>
  );
}
