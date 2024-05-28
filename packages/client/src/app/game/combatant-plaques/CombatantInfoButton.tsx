import { useGameStore } from "@/stores/game-store";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import { CombatantProperties, EntityProperties } from "@speed-dungeon/common";
import React from "react";

interface Props {
  combatantId: string;
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
}

export default function CombatantInfoButton({
  combatantId,
  entityProperties,
  combatantProperties,
}: Props) {
  const mutateGameState = useGameStore().mutateState;

  function handleClick() {
    mutateGameState((store) => {
      const detailedEntity = store.detailedEntity;
      let shouldSetEntityDetailed = true;
      if (detailedEntity && detailedEntity.type === DetailableEntityType.Combatant) {
        shouldSetEntityDetailed = detailedEntity.combatant.entityProperties.id !== combatantId;
      }

      if (shouldSetEntityDetailed)
        store.detailedEntity = {
          type: DetailableEntityType.Combatant,
          combatant: {
            entityProperties,
            combatantProperties,
          },
        };
      else store.detailedEntity = null;
    });
  }

  function handleMouseEnter() {
    mutateGameState((store) => {
      store.hoveredEntity = {
        type: DetailableEntityType.Combatant,
        combatant: {
          entityProperties,
          combatantProperties,
        },
      };
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
