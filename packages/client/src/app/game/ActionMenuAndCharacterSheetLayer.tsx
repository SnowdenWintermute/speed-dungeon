import React, { useRef } from "react";
import ActionMenu from "./ActionMenu";
import { AdventuringParty, InputLock } from "@speed-dungeon/common";
import ItemDetailsWithComparison from "./ItemDetailsWithComparison";
import ItemsOnGround from "./ItemsOnGround";
import CharacterSheet from "./character-sheet";
import { useGameStore } from "@/stores/game-store";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";
import { SPACING_REM } from "@/client_consts";
import { ZIndexLayers } from "../z-index-layers";

export default function ActionMenuAndCharacterSheetLayer({ party }: { party: AdventuringParty }) {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const viewingCharacterSheet = shouldShowCharacterSheet(currentMenu.type);

  return (
    <section
      style={{ zIndex: ZIndexLayers.CharacterSheetAndActionMenu, paddingTop: `calc(100vh / 7)` }}
      className={`absolute top-0 h-screen w-screen max-h-screen max-w-screen overflow-auto
      flex
      ${viewingCharacterSheet && "justify-end"}
      `}
    >
      <div className={`pl-4 pr-4 flex flex-col w-fit relative overflow-auto`}>
        <div className={`flex items-end w-fit`} style={{ marginBottom: `${SPACING_REM}rem` }}>
          <ActionMenu inputLocked={InputLock.isLocked(party.inputLock)} />
          <CharacterSheet showCharacterSheet={viewingCharacterSheet} />
        </div>
        <div className="flex">
          <div className="min-w-[25rem] max-w-[25rem]" style={{ marginRight: `${SPACING_REM}rem` }}>
            {viewingCharacterSheet && <ItemsOnGround maxHeightRem={13.375} party={party} />}
          </div>
          {viewingCharacterSheet && (
            <div className="min-w-[50rem] max-w-[50rem]">
              <ItemDetailsWithComparison flipDisplayOrder={false} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
