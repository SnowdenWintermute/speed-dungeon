import React from "react";
import ActionMenu from "./ActionMenu";
import { AdventuringParty, InputLock } from "@speed-dungeon/common";
import { MenuStateType } from "./ActionMenu/menu-state";
import ItemDetailsWithComparison from "./ItemDetailsWithComparison";
import ItemsOnGround from "./ItemsOnGround";
import CharacterSheet from "./character-sheet";
import CharacterSheetItemDetailsViewer from "./character-sheet/CharacterSheetItemDetailsViewer";
import { useGameStore } from "@/stores/game-store";
import shouldShowCharacterSheet from "@/utils/should-show-character-sheet";

export default function ActionMenuAndCharacterSheetLayer({ party }: { party: AdventuringParty }) {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const viewingCharacterSheet = shouldShowCharacterSheet(currentMenu.type);
  const conditionalStyles = viewingCharacterSheet ? "items-center justify-end" : "";

  const actionMenuAndCharacterSheetContainerConditionalClasses = viewingCharacterSheet
    ? ""
    : "w-full";

  return (
    <section
      className={`absolute z-31 top-1/2 -translate-y-1/2 w-full p-4 
      text-zinc-300 flex flex-row ${conditionalStyles} pointer-events-none`}
    >
      <div
        className={`flex flex-col max-w-full ${actionMenuAndCharacterSheetContainerConditionalClasses}`}
      >
        <div className="flex">
          <div className="flex flex-col flex-grow justify-end max-w-full">
            <div className="flex justify-between overflow-hidden">
              <ActionMenu inputLocked={InputLock.isLocked(party.inputLock)} />
              {!viewingCharacterSheet && (
                <div className="flex ">
                  <div className="max-h-[13.375rem] h-fit flex flex-grow justify-end relative">
                    <div className="absolute w-[50rem] right-[25rem]">
                      {currentMenu.type !== MenuStateType.CombatActionSelected && (
                        <ItemDetailsWithComparison flipDisplayOrder={true} />
                      )}
                    </div>
                    <div className="max-w-[25rem] w-[25rem]">
                      <ItemsOnGround party={party} maxHeightRem={25.0} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <CharacterSheet showCharacterSheet={viewingCharacterSheet} />
        </div>
        <CharacterSheetItemDetailsViewer
          party={party}
          viewingCharacterSheet={viewingCharacterSheet}
        />
      </div>
    </section>
  );
}
