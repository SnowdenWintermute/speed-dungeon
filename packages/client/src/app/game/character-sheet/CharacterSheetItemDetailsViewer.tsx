import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import { MenuContext, useGameStore } from "@/stores/game-store";
import React from "react";
import ItemDetailsWithComparison from "../ItemDetailsWithComparison";

export default function CharacterSheetItemDetailsViewer() {
  const menuContext = useGameStore().menuContext;

  const viewingCharacterSheet = menuContext !== null && menuContext !== MenuContext.ItemsOnGround;

  return (
    <div className="flex" style={{ paddingTop: `${SPACING_REM_SMALL}rem` }}>
      <div
        className="min-w-[25rem] max-w-[25rem] h-[13.375rem]"
        style={{ marginRight: `${SPACING_REM}rem` }}
      >
        <div className="max-h-[13.375rem]">
          {
            viewingCharacterSheet && <div />
            // <ItemsOnGround max_height={13.375} />
          }
        </div>
      </div>
      {viewingCharacterSheet && <ItemDetailsWithComparison flipDisplayOrder={false} />}
    </div>
  );
}
