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

export const setInventoryAsFreshStack = new ActionMenuButtonProperties(
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  () => {
    useGameStore.getState().mutateState((state) => {
      state.stackedMenuStates = [inventoryItemsMenuState];
      state.hoveredAction = null;
    });
  }
);
setInventoryOpen.dedicatedKeys = ["KeyI", toggleInventoryHotkey];
setInventoryAsFreshStack.dedicatedKeys = ["KeyI", toggleInventoryHotkey];

export const setViewingAbilityTreeHotkey = HOTKEYS.BOTTOM_ALT;

export const setViewingAbilityTreeAsFreshStack = new ActionMenuButtonProperties(
  `Abilities (${letterFromKeyCode(setViewingAbilityTreeHotkey)})`,
  `Abilities (${letterFromKeyCode(setViewingAbilityTreeHotkey)})`,
  () => {
    useGameStore.getState().mutateState((state) => {
      state.stackedMenuStates = [abilityTreeMenuState];
      state.hoveredAction = null;
      state.hoveredEntity = null;
    });
  }
);

setViewingAbilityTreeAsFreshStack.dedicatedKeys = [setViewingAbilityTreeHotkey];
