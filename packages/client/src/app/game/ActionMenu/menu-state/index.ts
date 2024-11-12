export enum MenuStateType {
  BaseOutOfCombat,
  BaseInCombat,
  CombatActionSelected,
  LevelUpAbilities,
  AssignAttributePoints,
  InventoryItems,
  ViewingEquipedItems,
  ItemSelected,
  ItemOnGroundSelected,
  ItemsOnGround,
  UnopenedChest,
  Staircase,
}

import { GameState } from "@/stores/game-store";
import { UIState } from "@/stores/ui-store";
import { AlertState } from "@/stores/alert-store";
import { FocusEventHandler, MouseEventHandler } from "react";

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
  page: number = 0;
  constructor(
    public gameState: GameState,
    public uiState: UIState,
    public alertState: AlertState,
    public type: MenuStateType
  ) {}
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
