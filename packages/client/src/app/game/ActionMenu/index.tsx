import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import {
  ACTION_MENU_CENTRAL_SECTION_HEIGHT,
  BUTTON_HEIGHT,
  BUTTON_HEIGHT_SMALL,
  SPACING_REM_SMALL,
} from "@/client_consts";
import { AbilityType, NextOrPrevious } from "@speed-dungeon/common";
import { CycleFocusedCharacterButtons } from "./CycleFocusedCharacterButtons";
import { StackedMenuStateDisplay } from "./StackedMenuStateDisplay";
import HoveredItemDisplay from "./HoveredItemDisplay";
import { CraftingItemDisplay } from "./CraftingItemDisplay";
import { CraftingItemMenuState } from "./menu-state/crafting-item";
import HoveredActionDisplay from "./HoveredActionDisplay";

export const ActionMenu = observer(({ inputLocked }: { inputLocked: boolean }) => {
  const { actionMenuStore, focusStore } = AppStore.get();

  const currentMenu = actionMenuStore.getCurrentMenu();
  const topSection = currentMenu.getTopSection();
  const numberedButtons = currentMenu.getNumberedButtonsOnCurrentPage();
  const centralSection = currentMenu.getCentralSection();
  const bottomSection = currentMenu.getBottomSection();

  const viewingCharacterSheet = actionMenuStore.shouldShowCharacterSheet();
  const craftingItem = currentMenu instanceof CraftingItemMenuState;
  const shouldShowHoveredItem = !viewingCharacterSheet && !craftingItem;
  const shouldShowCraftingItemDisplay = craftingItem;

  const { hovered: hoveredAction } = focusStore.combatantAbilities.get();
  const isHoveringAction = hoveredAction?.type === AbilityType.Action;
  const shouldShowHoveredActionDisplay = isHoveringAction && !viewingCharacterSheet;

  useEffect(() => {
    if (numberedButtons.length === 0 && currentMenu.pageIndex > 0) {
      currentMenu.turnPage(NextOrPrevious.Previous);
    }
  }, [numberedButtons.length, currentMenu.pageIndex]);

  if (inputLocked) return <div />;

  return (
    <section className={`flex flex-col justify-between`}>
      <CycleFocusedCharacterButtons />
      <StackedMenuStateDisplay />
      <div className="flex">
        <div className="flex flex-col">
          <div
            className={`flex list-none min-w-[25rem] max-w-[25rem] relative`}
            style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
          >
            {topSection}
          </div>
          <div
            className={`mb-3 flex flex-col min-w-[25rem] max-w-[25rem] border-t border-slate-400`}
            style={{
              height: `${ACTION_MENU_CENTRAL_SECTION_HEIGHT}rem`,
            }}
          >
            {numberedButtons}
            {centralSection}
          </div>
          <div className="min-w-[25rem] max-w-[25rem]">{bottomSection}</div>
        </div>
        <div style={{ paddingTop: `${SPACING_REM_SMALL + BUTTON_HEIGHT}rem` }}>
          {shouldShowHoveredItem && <HoveredItemDisplay />}
          {shouldShowCraftingItemDisplay && <CraftingItemDisplay equipment={currentMenu.item} />}
          {shouldShowHoveredActionDisplay && (
            <HoveredActionDisplay hoveredAction={hoveredAction.actionName} />
          )}
        </div>
      </div>
    </section>
  );
});
