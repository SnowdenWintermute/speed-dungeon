import { ActionMenuState } from "@/app/game/ActionMenu/menu-state";
import {
  MENU_STATE_TYPE_STRINGS,
  MenuStateType,
} from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { CombatActionName, EntityId } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class ActionMenuStore {
  private baseMenuState: ActionMenuState | null = null;
  private stackedMenuStates: ActionMenuState[] = [];
  private hoveredAction: null | CombatActionName = null;
  private showItemsOnGround: boolean = true;
  private combatantsWithPendingCraftActions: Set<EntityId> = new Set();

  constructor() {
    makeAutoObservable(this);
  }

  /** Avoid a circular dependency by not constructing the BaseMenuState class here
   * because the BaseMenuState class (like most MenuState classes) call AppStore.get()
   * and AppStore holds ActionMenuStore */
  initialize(baseMenuState: ActionMenuState) {
    this.baseMenuState = baseMenuState;
  }

  pushStack(menuState: ActionMenuState) {
    menuState.recalculateButtons();
    this.stackedMenuStates.push(menuState);
  }

  setShowGroundItems(shouldShow: boolean) {
    this.showItemsOnGround = shouldShow;
  }

  getShowGroundItems() {
    return this.showItemsOnGround;
  }

  popStack() {
    this.getCurrentMenu().goToFirstPage();
    const oldState = this.stackedMenuStates.pop();
    const newMenuState = this.getCurrentMenu();
    newMenuState.recalculateButtons();
    return oldState;
  }

  clearStack() {
    for (const menuState of this.stackedMenuStates) {
      menuState.goToFirstPage();
    }
    this.baseMenuState?.recalculateButtons();
    this.stackedMenuStates = [];
  }

  replaceStack(newStack: ActionMenuState[]) {
    this.clearStack();
    this.stackedMenuStates.push(...newStack);
    this.getCurrentMenu().recalculateButtons();
  }

  getStackedMenuStringNames() {
    return [this.baseMenuState, ...this.stackedMenuStates]
      .filter(Boolean)
      .map((menu) => MENU_STATE_TYPE_STRINGS[menu!.type]);
    // return ([this.baseMenuState] as ActionMenuState[])
    //   .concat(this.stackedMenuStates)
    //   .map((menuState) => MENU_STATE_TYPE_STRINGS[menuState.type]);
  }

  isInitialized() {
    return this.baseMenuState !== null;
  }

  currentMenuIsType(menuStateType: MenuStateType) {
    if (!this.isInitialized()) return false;
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
    else if (this.baseMenuState === null) {
      throw new Error("improperly initialized actionMenuStore - expected to have a baseMenuState");
    } else {
      return this.baseMenuState;
    }
  }

  isViewingItemsOnGround() {
    return this.currentMenuIsType(MenuStateType.ItemsOnGround);
  }

  shouldShowCharacterSheet() {
    for (const menuType of CHARACTER_SHEET_MENU_TYPES) {
      if (this.currentMenuIsType(menuType)) return true;
    }
    return this.viewingAbilityTree();
  }

  viewingAbilityTree() {
    for (const menuType of ABILITY_TREE_MENU_TYPES) {
      if (this.currentMenuIsType(menuType)) return true;
    }
    return false;
  }

  operatingVendingMachine() {
    for (const menuType of VENDING_MACHINE_MENU_TYPES) {
      if (this.currentMenuIsType(menuType)) return true;
    }
    return false;
  }

  setHoveredAction(actionName: CombatActionName) {
    this.hoveredAction = actionName;
  }

  clearHoveredAction() {
    this.hoveredAction = null;
  }

  getHoveredAction() {
    return this.hoveredAction;
  }

  setCharacterIsCrafting(entityId: EntityId) {
    this.combatantsWithPendingCraftActions.add(entityId);
  }

  setCharacterCompletedCrafting(entityId: EntityId) {
    this.combatantsWithPendingCraftActions.delete(entityId);
  }

  characterIsCrafting(entityId: EntityId) {
    return this.combatantsWithPendingCraftActions.has(entityId);
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
