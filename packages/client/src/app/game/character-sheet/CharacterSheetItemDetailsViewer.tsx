import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import { MenuContext, useGameStore } from "@/stores/game-store";
import React from "react";
import ItemDetailsWithComparison from "../ItemDetailsWithComparison";
import ItemsOnGround from "../ItemsOnGround";
import { AdventuringParty } from "@speed-dungeon/common";

interface Props {
  party: AdventuringParty;
}

export default function CharacterSheetItemDetailsViewer({ party }: Props) {
  const menuContext = useGameStore().menuContext;

  const viewingCharacterSheet = menuContext !== null && menuContext !== MenuContext.ItemsOnGround;

  return (
    <div className="flex" style={{ paddingTop: `${SPACING_REM_SMALL}rem` }}>
      <div
        className="min-w-[25rem] max-w-[25rem] h-[13.375rem]"
        style={{ marginRight: `${SPACING_REM}rem` }}
      >
        <div className="max-h-[13.375rem]">
          {viewingCharacterSheet && <ItemsOnGround maxHeightRem={13.375} party={party} />}
        </div>
      </div>
      {viewingCharacterSheet && <ItemDetailsWithComparison flipDisplayOrder={false} />}
    </div>
  );
}
