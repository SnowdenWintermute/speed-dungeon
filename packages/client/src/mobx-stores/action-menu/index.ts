import { ActionMenuState, MenuStateType } from "@/app/game/ActionMenu/menu-state";
import { BaseMenuState } from "@/app/game/ActionMenu/menu-state/base";
import { CombatActionName } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class ActionMenuStore {
  private baseMenuState: ActionMenuState = new BaseMenuState(false);
  private stackedMenuStates: ActionMenuState[] = [];
  private hoveredAction: null | CombatActionName = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  clearStack() {
    this.stackedMenuStates = [];
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
