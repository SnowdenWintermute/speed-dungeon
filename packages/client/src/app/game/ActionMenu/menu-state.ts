// export enum MenuType {
//   OutOfCombat,
//   InCombat,
//   CombatActionSelected,
//   LevelUpAbilities,
//   AssignAttributePoints,
//   InventoryOpen,
//   ViewingEquipedItems,
//   ItemSelected,
//   ItemOnGroundSelected,
//   ItemsOnGround,
//   UnopenedChest,
//   Staircase,
// }

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
  constructor(
    public gameState: GameState,
    public uiState: UIState,
    public alertState: AlertState
  ) {}
  abstract getButtonProperties(): ActionButtonsByCategory;
}

export class BaseMenuState implements ActionMenuState {
  constructor(
    public gameState: GameState,
    public uiState: UIState,
    public alertState: AlertState
    // public setState: React.Dispatch<Sta
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const setInventoryOpen = new ActionMenuButtonProperties("Open Inventory", () => {
      this.gameState.mutateState((state) => {
        state;
      });
    });
    setInventoryOpen.dedicatedKeys = ["KeyI", "KeyS"];
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);
    // gameActions.push({ type: GameActionType.SetInventoryOpen, shouldBeOpen: !inventoryIsOpen });
    // gameActions.push({ type: GameActionType.ToggleReadyToExplore });
    // addAbilityGameActionsToList(gameActions, abilities);
    // gameActions.push({
    //   type: GameActionType.SetAssignAttributePointsMenuOpen,
    //   shouldBeOpen: true,
    // });
    return toReturn;
  }
}

// instantiate all states upfront and save them, or just save them as they are created
// so we don't pay object creation cost every time we switch state

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
