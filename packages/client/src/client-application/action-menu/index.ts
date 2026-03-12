import { CombatantId, isDefined } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { ActionMenuScreenPool } from "./action-menu-screen-pool";
import { ActionMenuScreen } from "./screens";
import { ActionMenuScreenType, MENU_STATE_TYPE_STRINGS } from "./screen-types";

export class ActionMenu {
  private baseActionMenuScreen: ActionMenuScreen | null = null;
  private stackedActionMenuScreens: ActionMenuScreen[] = [];
  private showItemsOnGround: boolean = true;
  private combatantsWithPendingCraftActions = new Set<CombatantId>();
  private _menuStatePool = new ActionMenuScreenPool();

  constructor() {
    makeAutoObservable(this);
  }

  /** Avoid a circular dependency by not constructing the BaseActionMenuScreen class here
   * because the BaseActionMenuScreen class (like most ActionMenuScreen classes) call AppStore.get()
   * and AppStore holds ActionMenuStore */
  initialize(baseActionMenuScreen: ActionMenuScreen) {
    this.baseActionMenuScreen = baseActionMenuScreen;
  }

  pushFromPool(type: ActionMenuScreenType) {
    const menuState = this._menuStatePool.get(type);
    this.pushStack(menuState);
  }

  pushStack(menuState: ActionMenuScreen) {
    this.stackedActionMenuScreens.push(menuState);
  }

  setShowGroundItems(shouldShow: boolean) {
    this.showItemsOnGround = shouldShow;
  }

  getShowGroundItems() {
    return this.showItemsOnGround;
  }

  popStack() {
    this.getCurrentMenu().goToFirstPage();
    const oldState = this.stackedActionMenuScreens.pop();
    return oldState;
  }

  clearStack() {
    for (const menuState of this.stackedActionMenuScreens) {
      menuState.goToFirstPage();
    }

    this.stackedActionMenuScreens = [];
  }

  replaceStack(newStack: ActionMenuScreen[]) {
    this.clearStack();
    this.stackedActionMenuScreens.push(...newStack);
  }

  getStackedMenuStringNames() {
    return [this.baseActionMenuScreen, ...this.stackedActionMenuScreens]
      .filter(isDefined)
      .map((menu) => MENU_STATE_TYPE_STRINGS[menu.type]);
  }

  isInitialized() {
    return this.baseActionMenuScreen !== null;
  }

  currentMenuIsType(menuStateType: ActionMenuScreenType) {
    if (!this.isInitialized()) return false;
    return this.getCurrentMenu().type === menuStateType;
  }

  hasStackedMenus() {
    return this.stackedActionMenuScreens.length > 0;
  }

  stackedMenusIncludeType(menuStateType: ActionMenuScreenType) {
    return this.stackedActionMenuScreens.map((menuState) => menuState.type).includes(menuStateType);
  }

  removeMenuFromStack(menuStateType: ActionMenuScreenType) {
    this.stackedActionMenuScreens = this.stackedActionMenuScreens.filter(
      (menuState) => menuState.type !== menuStateType
    );
  }

  getCurrentMenu() {
    const topIndex = this.stackedActionMenuScreens.length - 1;
    const topStackedMenu = this.stackedActionMenuScreens[topIndex];
    if (topStackedMenu) return topStackedMenu;
    else if (this.baseActionMenuScreen === null) {
      throw new Error(
        "improperly initialized actionMenuStore - expected to have a baseActionMenuScreen"
      );
    } else {
      return this.baseActionMenuScreen;
    }
  }

  isViewingItemsOnGround() {
    return this.currentMenuIsType(ActionMenuScreenType.ItemsOnGround);
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

  setCharacterIsCrafting(entityId: CombatantId) {
    this.combatantsWithPendingCraftActions.add(entityId);
  }

  setCharacterCompletedCrafting(entityId: CombatantId) {
    this.combatantsWithPendingCraftActions.delete(entityId);
  }

  characterIsCrafting(entityId: CombatantId) {
    return this.combatantsWithPendingCraftActions.has(entityId);
  }
}

const CHARACTER_SHEET_MENU_TYPES = [
  ActionMenuScreenType.InventoryItems,
  ActionMenuScreenType.ViewingEquipedItems,
  ActionMenuScreenType.AssignAttributePoints,
  ActionMenuScreenType.ItemSelected,
];

const ABILITY_TREE_MENU_TYPES = [
  ActionMenuScreenType.ViewingAbilityTree,
  ActionMenuScreenType.ConsideringAbilityTreeColumn,
  ActionMenuScreenType.ConsideringAbilityTreeAbility,
];

const VENDING_MACHINE_MENU_TYPES = [
  ActionMenuScreenType.PurchasingItems,
  ActionMenuScreenType.CraftingItemSelection,
  ActionMenuScreenType.OperatingVendingMachine,
  ActionMenuScreenType.CraftingActionSelection,
  ActionMenuScreenType.RepairItemSelection,
  ActionMenuScreenType.ShardItemSelection,
];
