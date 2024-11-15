import { useGameStore } from "@/stores/game-store";
import { Combatant } from "@speed-dungeon/common";
import React from "react";

interface Props {
  combatant: Combatant;
}

export default function CombatantInfoButton({ combatant }: Props) {
  const mutateGameState = useGameStore().mutateState;

  function handleClick() {
    mutateGameState((store) => {
      const detailedEntity = store.detailedEntity;
      let shouldSetEntityDetailed = true;
      if (detailedEntity && detailedEntity instanceof Combatant) {
        shouldSetEntityDetailed =
          detailedEntity.entityProperties.id !== combatant.entityProperties.id;
      }

      if (shouldSetEntityDetailed)
        store.detailedEntity = new Combatant(
          combatant.entityProperties,
          combatant.combatantProperties
        );
      else store.detailedEntity = null;
    });
  }

  function handleMouseEnter() {
    mutateGameState((store) => {
      store.hoveredEntity = new Combatant(
        combatant.entityProperties,
        combatant.combatantProperties
      );
    });
  }

  function handleMouseLeave() {
    mutateGameState((store) => {
      store.hoveredEntity = null;
    });
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="hover:bg-slate-950 hover:border-slate-400 rounded-full leading-4"
    >
      {"ⓘ "}
    </button>
  );
}
