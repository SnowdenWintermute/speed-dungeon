import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { useGameStore } from "@/stores/game-store";
import { AppStore } from "@/mobx-stores/app-store";
import { MENU_STATE_POOL } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuButtonProperties } from "../action-menu-button-properties";
import { MenuStateType } from "../menu-state-type";

export const toggleInventoryHotkey = HOTKEYS.MAIN_1;

export const setInventoryOpen = new ActionMenuButtonProperties(
  () => `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  () => {
    const { actionMenuStore } = AppStore.get();
    actionMenuStore.hoveredAction = null;
    actionMenuStore.pushStack(MENU_STATE_POOL[MenuStateType.InventoryItems]);
  }
);

export const setInventoryAsFreshStack = new ActionMenuButtonProperties(
  () => `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  `Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
  () => {
    const { actionMenuStore } = AppStore.get();
    actionMenuStore.hoveredAction = null;
    actionMenuStore.replaceStack([MENU_STATE_POOL[MenuStateType.InventoryItems]]);
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
    const { actionMenuStore } = AppStore.get();
    actionMenuStore.hoveredAction = null;
    actionMenuStore.replaceStack([MENU_STATE_POOL[MenuStateType.ViewingAbilityTree]]);
  }
);

setViewingAbilityTreeAsFreshStack.dedicatedKeys = [setViewingAbilityTreeHotkey];
