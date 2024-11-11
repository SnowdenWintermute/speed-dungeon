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

import {
  GameState,
  baseMenuState,
  inventoryItemsMenuState,
  useGameStore,
} from "@/stores/game-store";
import { UIState, useUIStore } from "@/stores/ui-store";
import { AlertState, useAlertStore } from "@/stores/alert-store";
import { FocusEventHandler, MouseEventHandler } from "react";
import { websocketConnection } from "@/singletons/websocket-connection";
import { ClientToServerEvent } from "@speed-dungeon/common";

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
        state.menuState = inventoryItemsMenuState;
      });
    });
    setInventoryOpen.dedicatedKeys = ["KeyI", "KeyS"];
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    const toggleReadyToExplore = new ActionMenuButtonProperties("Ready to explore", () => {
      websocketConnection.emit(ClientToServerEvent.ToggleReadyToExplore);
    });
    toReturn[ActionButtonCategory.Numbered].push(toggleReadyToExplore);

    // addAbilityGameActionsToList(gameActions, abilities);
    // gameActions.push({
    //   type: GameActionType.SetAssignAttributePointsMenuOpen,
    //   shouldBeOpen: true,
    // });
    return toReturn;
  }
}

export class InCombatMenuState implements ActionMenuState {
  constructor(
    public gameState: GameState,
    public uiState: UIState,
    public alertState: AlertState
    // public setState: React.Dispatch<Sta
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const inCombatButton = new ActionMenuButtonProperties("In combat button", () => {});
    inCombatButton.dedicatedKeys = ["KeyI", "KeyS"];
    toReturn[ActionButtonCategory.Top].push(inCombatButton);

    // addAbilityGameActionsToList(gameActions, abilities);
    // gameActions.push({
    //   type: GameActionType.SetAssignAttributePointsMenuOpen,
    //   shouldBeOpen: true,
    // });
    return toReturn;
  }
}

export class InventoryItemsMenuState implements ActionMenuState {
  constructor(
    public gameState: GameState,
    public uiState: UIState,
    public alertState: AlertState
  ) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const closeInventory = new ActionMenuButtonProperties("Close Inventory", () => {
      this.gameState.mutateState((state) => {
        state.menuState = baseMenuState;
      });
    });
    closeInventory.dedicatedKeys = ["KeyI", "KeyS", "Escape"];
    toReturn[ActionButtonCategory.Top].push(closeInventory);

    return toReturn;
  }
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
