import { FocusEventHandler, MouseEventHandler } from "react";

export enum MenuStateType {
  Base, //
  CombatActionSelected, //
  AssignAttributePoints,
  InventoryItems, //
  ViewingEquipedItems,
  ItemSelected, //
  ItemOnGroundSelected,
  ItemsOnGround,
  Staircase,
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
  numPages: number = 1;
  constructor(public type: MenuStateType) {}
  abstract getButtonProperties(): ActionButtonsByCategory;
}

export class ActionMenuButtonProperties {
  focusHandler?: FocusEventHandler<HTMLButtonElement>;
  blurHandler?: FocusEventHandler<HTMLButtonElement>;
  mouseEnterHandler?: MouseEventHandler<HTMLButtonElement>;
  mouseLeaveHandler?: MouseEventHandler<HTMLButtonElement>;
  shouldBeDisabled: boolean = false;
  dedicatedKeys: string[] = [];
  constructor(
    public text: string,
    public clickHandler: MouseEventHandler<HTMLButtonElement>
  ) {}
}
