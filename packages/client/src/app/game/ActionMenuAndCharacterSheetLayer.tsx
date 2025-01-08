import React from "react";
import ActionMenu from "./ActionMenu";
import { AdventuringParty, InputLock } from "@speed-dungeon/common";
import ItemDetailsWithComparison from "./ItemDetailsWithComparison";
import ItemsOnGround from "./ItemsOnGround";
import CharacterSheet from "./character-sheet";
import { useGameStore } from "@/stores/game-store";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";
import { SPACING_REM } from "@/client_consts";
import { ZIndexLayers } from "../z-index-layers";
import ItemCraftDisplay from "./item-crafting/ItemCraftingDisplay";

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
      <div className={`pl-4 pr-4 flex flex-col relative overflow-auto `}>
        <div
          className={`flex items-end w-full h-fit`}
          style={{ marginBottom: `${SPACING_REM}rem` }}
        >
          <div style={{ marginRight: `${SPACING_REM}rem` }} className="flex">
            <ActionMenu inputLocked={InputLock.isLocked(party.inputLock)} />
            <div className="ml-3 h-1 w-fit">
              <div className="fixed">{<ItemCraftDisplay />}</div>
            </div>
          </div>
          <CharacterSheet showCharacterSheet={viewingCharacterSheet} />
        </div>
        <div className="flex  w-full">
          <div className="min-w-[25rem] max-w-[25rem]" style={{ marginRight: `${SPACING_REM}rem` }}>
            {viewingCharacterSheet && <ItemsOnGround maxHeightRem={13.375} party={party} />}
          </div>
          {viewingCharacterSheet && (
            <div className="" style={{ flex: 1 }}>
              <ItemDetailsWithComparison />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
