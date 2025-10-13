import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { ActionMenuButtonProperties } from "..";
import { abilityTreeMenuState, inventoryItemsMenuState, useGameStore } from "@/stores/game-store";
import { AppStore } from "@/mobx-stores/app-store";

export const toggleInventoryHotkey = HOTKEYS.MAIN_1;

export const setInventoryOpen = new ActionMenuButtonProperties(
  () => `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  () => {
    const { actionMenuStore } = AppStore.get();
    actionMenuStore.hoveredAction = null;
    useGameStore.getState().mutateState((state) => {
      state.stackedMenuStates.push(inventoryItemsMenuState);
    });
  }
);

export const setInventoryAsFreshStack = new ActionMenuButtonProperties(
  () => `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  () => {
    const { actionMenuStore } = AppStore.get();
    actionMenuStore.hoveredAction = null;
    useGameStore.getState().mutateState((state) => {
      state.stackedMenuStates = [inventoryItemsMenuState];
    });
  }
);
setInventoryOpen.dedicatedKeys = ["KeyI", toggleInventoryHotkey];
setInventoryAsFreshStack.dedicatedKeys = ["KeyI", toggleInventoryHotkey];

export const setViewingAbilityTreeHotkey = HOTKEYS.BOTTOM_ALT;

export const setViewingAbilityTreeAsFreshStack = new ActionMenuButtonProperties(
  () => {
    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    let unspent = 0;
    if (!(focusedCharacterResult instanceof Error))
      unspent = focusedCharacterResult.combatantProperties.abilityProperties.unspentAbilityPoints;
    const highlightClass = unspent ? "text-yellow-400" : "";

    return (
      <div className={`${highlightClass}`}>
        Abilities ({letterFromKeyCode(setViewingAbilityTreeHotkey)})
      </div>
    );
  },
  `Abilities (${letterFromKeyCode(setViewingAbilityTreeHotkey)})`,
  () => {
    AppStore.get().actionMenuStore.hoveredAction = null;
    useGameStore.getState().mutateState((state) => {
      state.stackedMenuStates = [abilityTreeMenuState];
    });
  }
);

setViewingAbilityTreeAsFreshStack.dedicatedKeys = [setViewingAbilityTreeHotkey];
