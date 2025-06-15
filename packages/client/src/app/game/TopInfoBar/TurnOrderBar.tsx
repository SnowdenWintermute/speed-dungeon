import { useGameStore } from "@/stores/game-store";
import getGameAndParty from "@/utils/getGameAndParty";
import { Battle, CombatantTurnTracker } from "@speed-dungeon/common";
import React, { useState } from "react";

interface Props {
  battle: Battle;
}

export default function TurnOrderBar(props: Props) {
  return (
    <div className="flex h-full items-center">
      <div className="h-full mr-2 flex items-center">Turn order: </div>
      {props.battle.turnOrderManager.turnTrackers.map((tracker) => (
        <TurnOrderTrackerIcon key={tracker.getId()} tracker={tracker} />
      ))}
    </div>
  );
}

const SHOWN_CLASSES = "mr-2 last:mr-0";

function TurnOrderTrackerIcon({ tracker }: { tracker: CombatantTurnTracker }) {
  const gameOption = useGameStore().game;
  const usernameOption = useGameStore().username;
  const result = getGameAndParty(gameOption, usernameOption);
  if (result instanceof Error) return <div>{result.message}</div>;
  const [game, party] = result;
  let [preRemovalClassesState, _setPreRemovalClassesState] = useState(SHOWN_CLASSES);
  let [transitionStyle, _setTransitionStyle] = useState({ transition: "width 1s" });

  const combatantIsAlly = party.characterPositions.includes(tracker.combatantId);
  const combatant = tracker.getCombatant(party);

  const { entityProperties, combatantProperties: _ } = combatant;

  const conditionalClasses = combatantIsAlly ? "bg-emerald-900" : "bg-amber-900";

  function handleClick() {
    //
  }

  const [hiddenClass, setHiddenClass] = useState("hidden");
  function onMouseEnter() {
    setHiddenClass("");
  }
  function onMouseLeave() {
    setHiddenClass("hidden");
  }

  return (
    <button
      className={`border border-slate-400 h-10 w-10 ${conditionalClasses} mr-2 last:mr-0 ${preRemovalClassesState}`}
      style={transitionStyle}
      onClick={handleClick}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      <div className="h-full w-full rounded-full bg-slate-600 border border-slate-400 flex items-center justify-center">
        <span className="">{entityProperties.name.slice(0, 2).toUpperCase()}</span>
        <div className={`text-2xl absolute top-[160px] ${hiddenClass}`}>
          <div>{tracker.timeOfNextMove}</div>
        </div>
      </div>
    </button>
  );
}
