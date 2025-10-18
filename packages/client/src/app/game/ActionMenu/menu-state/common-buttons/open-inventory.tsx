import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "../action-menu-button-properties";
import { MenuStateType } from "../menu-state-type";
import { MenuStatePool } from "@/mobx-stores/action-menu/menu-state-pool";

export const toggleInventoryHotkey = HOTKEYS.MAIN_1;

export const setInventoryOpen = new ActionMenuButtonProperties(
  () => `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  () => {
    const { actionMenuStore } = AppStore.get();
    actionMenuStore.clearHoveredAction();
    const inventoryItemsMenu = MenuStatePool.get(MenuStateType.InventoryItems);
    console.log("inventoryItemsMenu:", inventoryItemsMenu);
    actionMenuStore.pushStack(inventoryItemsMenu);
  }
);

export const setInventoryAsFreshStack = new ActionMenuButtonProperties(
  () => `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  () => {
    const { actionMenuStore } = AppStore.get();
    actionMenuStore.clearHoveredAction();
    actionMenuStore.replaceStack([MenuStatePool.get(MenuStateType.InventoryItems)]);
  }
);
setInventoryOpen.dedicatedKeys = ["KeyI", toggleInventoryHotkey];
setInventoryAsFreshStack.dedicatedKeys = ["KeyI", toggleInventoryHotkey];

export const setViewingAbilityTreeHotkey = HOTKEYS.BOTTOM_ALT;

export const setViewingAbilityTreeAsFreshStack = new ActionMenuButtonProperties(
  () => {
    const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
    const unspent = focusedCharacter.combatantProperties.abilityProperties.unspentAbilityPoints;
    const highlightClass = unspent ? "text-yellow-400" : "";

    return (
      <div className={`${highlightClass}`}>
        Abilities ({letterFromKeyCode(setViewingAbilityTreeHotkey)})
      </div>
    );
  },
  `Abilities (${letterFromKeyCode(setViewingAbilityTreeHotkey)})`,
  () => {
    const { actionMenuStore } = AppStore.get();
    actionMenuStore.clearHoveredAction();
    actionMenuStore.replaceStack([MenuStatePool.get(MenuStateType.ViewingAbilityTree)]);
  }
);

setViewingAbilityTreeAsFreshStack.dedicatedKeys = [setViewingAbilityTreeHotkey];
