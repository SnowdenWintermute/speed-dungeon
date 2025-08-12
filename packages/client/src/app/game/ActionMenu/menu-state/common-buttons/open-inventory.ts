import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { ActionMenuButtonProperties } from "..";
import { abilityTreeMenuState, inventoryItemsMenuState, useGameStore } from "@/stores/game-store";

export const toggleInventoryHotkey = HOTKEYS.MAIN_1;

export const setInventoryOpen = new ActionMenuButtonProperties(
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  () => {
    useGameStore.getState().mutateState((state) => {
      state.stackedMenuStates.push(inventoryItemsMenuState);
      state.hoveredAction = null;
    });
  }
);
setInventoryOpen.dedicatedKeys = ["KeyI", toggleInventoryHotkey];

export const setViewingAbilityTreeHotkey = HOTKEYS.BOTTOM_ALT;

export const setViewingAbilityTree = new ActionMenuButtonProperties(
  `Abilities (${letterFromKeyCode(setViewingAbilityTreeHotkey)})`,
  `Abilities (${letterFromKeyCode(setViewingAbilityTreeHotkey)})`,
  () => {
    useGameStore.getState().mutateState((state) => {
      state.stackedMenuStates.push(abilityTreeMenuState);
      state.hoveredAction = null;
    });
  }
);

setViewingAbilityTree.dedicatedKeys = [setViewingAbilityTreeHotkey];
