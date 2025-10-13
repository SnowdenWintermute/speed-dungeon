import { ActionMenuState } from "@/app/game/ActionMenu/menu-state";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import {
  MENU_STATE_TYPE_STRINGS,
  MenuStateType,
} from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { CombatActionName } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class ActionMenuStore {
  private baseMenuState: ActionMenuState = new BaseMenuState();
  private stackedMenuStates: ActionMenuState[] = [];
  hoveredAction: null | CombatActionName = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  pushStack(menuState: ActionMenuState) {
    this.stackedMenuStates.push(menuState);
  }

  popStack() {
    this.getCurrentMenu().goToFirstPage();
    return this.stackedMenuStates.pop();
  }

  clearStack() {
    for (const menuState of this.stackedMenuStates) {
      menuState.goToFirstPage();
    }
    this.stackedMenuStates = [];
  }

  replaceStack(newStack: ActionMenuState[]) {
    this.clearStack();
    this.stackedMenuStates = newStack;
  }

  getStackedMenuStringNames() {
    return ([this.baseMenuState] as ActionMenuState[])
      .concat(this.stackedMenuStates)
      .map((menuState) => MENU_STATE_TYPE_STRINGS[menuState.type]);
  }

  currentMenuIsType(menuStateType: MenuStateType) {
    return this.getCurrentMenu().type === menuStateType;
  }

  hasStackedMenus() {
    return this.stackedMenuStates.length > 0;
  }

  stackedMenusIncludeType(menuStateType: MenuStateType) {
    return this.stackedMenuStates.map((menuState) => menuState.type).includes(menuStateType);
  }

  removeMenuFromStack(menuStateType: MenuStateType) {
    this.stackedMenuStates = this.stackedMenuStates.filter(
      (menuState) => menuState.type !== menuStateType
    );
  }

  getCurrentMenu() {
    const topIndex = this.stackedMenuStates.length - 1;
    const topStackedMenu = this.stackedMenuStates[topIndex];
    if (topStackedMenu) return topStackedMenu;
    else return this.baseMenuState;
  }

  shouldShowCharacterSheet() {
    const currentMenuType = this.getCurrentMenu().type;
    const isCharacterSheetType = CHARACTER_SHEET_MENU_TYPES.includes(currentMenuType);
    return isCharacterSheetType || this.viewingAbilityTree();
  }

  viewingAbilityTree() {
    const currentMenuType = this.getCurrentMenu().type;
    return ABILITY_TREE_MENU_TYPES.includes(currentMenuType);
  }

  operatingVendingMachine() {
    const currentMenuType = this.getCurrentMenu().type;
    return VENDING_MACHINE_MENU_TYPES.includes(currentMenuType);
  }
}

const CHARACTER_SHEET_MENU_TYPES = [
  MenuStateType.InventoryItems,
  MenuStateType.ViewingEquipedItems,
  MenuStateType.AssignAttributePoints,
  MenuStateType.ItemSelected,
];

const ABILITY_TREE_MENU_TYPES = [
  MenuStateType.ViewingAbilityTree,
  MenuStateType.ConsideringAbilityTreeColumn,
  MenuStateType.ConsideringAbilityTreeAbility,
];

const VENDING_MACHINE_MENU_TYPES = [
  MenuStateType.PurchasingItems,
  MenuStateType.CraftingItemSelection,
  MenuStateType.OperatingVendingMachine,
  MenuStateType.CraftingActionSelection,
  MenuStateType.RepairItemSelection,
  MenuStateType.ShardItemSelection,
];
