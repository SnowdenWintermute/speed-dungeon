import React from "react";
import ActionMenu from "./ActionMenu";
import { AdventuringParty, ERROR_MESSAGES, InputLock } from "@speed-dungeon/common";
import ItemDetailsWithComparison from "./ItemDetailsWithComparison";
import ItemsOnGround from "./ItemsOnGround";
import CharacterSheet from "./character-sheet";
import { useGameStore } from "@/stores/game-store";
import { shouldShowCharacterSheet, viewingAbilityTree } from "@/utils/should-show-character-sheet";
import { SPACING_REM } from "@/client_consts";
import { ZIndexLayers } from "../z-index-layers";
import ItemCraftDisplay from "./item-crafting/ItemCraftingDisplay";
import { CraftingItemMenuState } from "./ActionMenu/menu-state/crafting-item";
import CharacterAttributes from "./character-sheet/CharacterAttributes";

export default function ActionMenuAndCharacterSheetLayer({ party }: { party: AdventuringParty }) {
  const currentMenu = useGameStore.getState().getCurrentMenu();
  const viewingCharacterSheet = shouldShowCharacterSheet(currentMenu.type);
  const abilityTreeOpen = viewingAbilityTree(currentMenu.type);

  const focusedCharacterResult = useGameStore().getFocusedCharacter();
  const focusedCharacterOption =
    focusedCharacterResult instanceof Error ? null : focusedCharacterResult;
  if (!focusedCharacterOption) return <div>{ERROR_MESSAGES.COMBATANT.NOT_FOUND}</div>;

  return (
    <section
      style={{ zIndex: ZIndexLayers.CharacterSheetAndActionMenu, paddingTop: `calc(100vh / 11)` }}
      className={`absolute top-0 h-screen w-screen max-h-screen max-w-screen overflow-auto
      flex
      ${viewingCharacterSheet && "justify-end"}
      `}
    >
      <div className={`pl-4 pr-4 flex flex-col relative overflow-auto `}>
        <div className={`flex items-end w-full`} style={{ marginBottom: `${SPACING_REM}rem` }}>
          <div style={{ marginRight: `${SPACING_REM}rem` }} className="flex">
            <ActionMenu inputLocked={InputLock.isLocked(party.inputLock)} />

            {currentMenu instanceof CraftingItemMenuState && (
              <div className="ml-3 h-1 w-fit">
                <div className="fixed">
                  <ItemCraftDisplay />
                </div>
              </div>
            )}
          </div>
          <CharacterSheet
            showCharacterSheet={viewingCharacterSheet && !InputLock.isLocked(party.inputLock)}
          />
        </div>
        <div className="flex  w-full">
          <div className="min-w-[25rem] max-w-[25rem]" style={{ marginRight: `${SPACING_REM}rem` }}>
            {viewingCharacterSheet && !abilityTreeOpen && (
              <ItemsOnGround maxHeightRem={13.375} party={party} />
            )}
            {abilityTreeOpen && (
              <div className=" bg-slate-700 p-2 border border-slate-400 pointer-events-auto">
                <CharacterAttributes
                  combatant={focusedCharacterOption}
                  showAttributeAssignmentButtons={true}
                  widthOptionClass={"w-full"}
                  hideHeader={true}
                />
              </div>
            )}
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
