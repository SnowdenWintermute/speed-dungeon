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

import { ActionMenuButtonProperties } from "./action-menu-button-properties";

export interface ActionMenuState {
  getButtonProperties(): ActionMenuButtonProperties[];
}

export class BaseMenuState implements ActionMenuState {
  getButtonProperties(): ActionMenuButtonProperties[] {
    // gameActions.push({ type: GameActionType.SetInventoryOpen, shouldBeOpen: !inventoryIsOpen });
    // gameActions.push({ type: GameActionType.ToggleReadyToExplore });
    // addAbilityGameActionsToList(gameActions, abilities);
    // gameActions.push({
    //   type: GameActionType.SetAssignAttributePointsMenuOpen,
    //   shouldBeOpen: true,
    // });
    return [];
  }
}

// instantiate all states upfront and save them, or just save them as they are created
// so we don't pay object creation cost every time we switch state
