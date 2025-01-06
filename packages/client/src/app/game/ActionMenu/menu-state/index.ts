import { FocusEventHandler, MouseEventHandler } from "react";

export enum MenuStateType {
  Base, //
  CombatActionSelected, //
  AssignAttributePoints,
  InventoryItems, //
  ViewingEquipedItems,
  ItemSelected, //
  CraftingActionSelection,
  ItemOnGroundSelected,
  ItemsOnGround,
  Staircase,
  OperatingVendingMachine,
  PurchasingItems,
  CraftingItemSelection,
}

export enum ActionButtonCategory {
  Top,
  Numbered,
  Bottom,
}

export class ActionButtonsByCategory {
  [ActionButtonCategory.Top]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Numbered]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Bottom]: ActionMenuButtonProperties[] = [];
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
  constructor(
    public text: string,
    public clickHandler: MouseEventHandler<HTMLButtonElement>
  ) {}
}
