import React, { useRef } from "react";
import ActionMenu from "./ActionMenu";
import { AdventuringParty, InputLock } from "@speed-dungeon/common";
import ItemDetailsWithComparison from "./ItemDetailsWithComparison";
import ItemsOnGround from "./ItemsOnGround";
import CharacterSheet from "./character-sheet";
import { useGameStore } from "@/stores/game-store";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";
import { SPACING_REM } from "@/client_consts";

export default function ActionMenuAndCharacterSheetLayer({ party }: { party: AdventuringParty }) {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const viewingCharacterSheet = shouldShowCharacterSheet(currentMenu.type);
  const topContentRef = useRef<HTMLDivElement>(null);

  return (
    <section className={`absolute top-0 pl-4 z-31 h-screen w-screen overscroll-auto`}>
      <div className="flex flex-col w-fit absolute" style={{ top: `calc(100vh / 7)` }}>
        <div
          ref={topContentRef}
          className="flex items-end w-fit"
          style={{ marginBottom: `${SPACING_REM}rem` }}
        >
          <div style={{ marginRight: `${SPACING_REM}rem` }}>
            <ActionMenu inputLocked={InputLock.isLocked(party.inputLock)} />
          </div>
          <CharacterSheet showCharacterSheet={viewingCharacterSheet} />
        </div>
        <div className="flex">
          <div className="min-w-[25rem] max-w-[25rem]" style={{ marginRight: `${SPACING_REM}rem` }}>
            <ItemsOnGround maxHeightRem={13.375} party={party} />
          </div>
          <ItemDetailsWithComparison flipDisplayOrder={false} />
        </div>
      </div>
    </section>
  );
}
