import { FocusEventHandler, MouseEventHandler, ReactNode } from "react";

export enum MenuStateType {
  Base,
  CombatActionSelected,
  AssignAttributePoints,
  InventoryItems,
  ViewingEquipedItems,
  ItemSelected,
  CraftingActionSelection,
  ItemsOnGround,
  OperatingVendingMachine,
  PurchasingItems,
  CraftingItemSelection,
  RepairItemSelection,
  ShardItemSelection,
  ConfimConvertToShards,
}

export const MENU_STATE_TYPE_STRINGS: Record<MenuStateType, string> = {
  [MenuStateType.Base]: "Action Menu",
  [MenuStateType.CombatActionSelected]: "Combat action selected",
  [MenuStateType.AssignAttributePoints]: "Assigning attribute points",
  [MenuStateType.InventoryItems]: "Inventory",
  [MenuStateType.ViewingEquipedItems]: "Viewing equipped items",
  [MenuStateType.ItemSelected]: "Considering item",
  [MenuStateType.CraftingActionSelection]: "Selecting crafting action",
  [MenuStateType.ItemsOnGround]: "Viewing items on ground",
  [MenuStateType.OperatingVendingMachine]: "Operating vending machine",
  [MenuStateType.PurchasingItems]: "Purchasing items",
  [MenuStateType.CraftingItemSelection]: "Selecting item to craft",
  [MenuStateType.RepairItemSelection]: "Selecting item to repair",
  [MenuStateType.ShardItemSelection]: "Converting items to shards",
  [MenuStateType.ConfimConvertToShards]: "Confirm item destruction",
};

export enum ActionButtonCategory {
  Top,
  Numbered,
  Bottom,
  Hidden,
}

export class ActionButtonsByCategory {
  [ActionButtonCategory.Top]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Numbered]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Bottom]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Hidden]: ActionMenuButtonProperties[] = [];

  constructor() {}
}

export abstract class ActionMenuState {
  page: number = 1;
  constructor(
    public type: MenuStateType,
    public numPages: number
  ) {}
  abstract getButtonProperties(): ActionButtonsByCategory;
}

export class ActionMenuButtonProperties {
  focusHandler?: FocusEventHandler<HTMLLIElement>;
  blurHandler?: FocusEventHandler<HTMLLIElement>;
  mouseEnterHandler?: MouseEventHandler<HTMLLIElement>;
  mouseLeaveHandler?: MouseEventHandler<HTMLLIElement>;
  shouldBeDisabled: boolean = false;
  dedicatedKeys: string[] = [];
  shouldDisableMainClickOnly: boolean = false;
  constructor(
    public jsx: ReactNode,
    public key: string,
    public clickHandler: MouseEventHandler<HTMLButtonElement>,
    public alternateClickHandler?: MouseEventHandler<HTMLButtonElement>
  ) {}
}
