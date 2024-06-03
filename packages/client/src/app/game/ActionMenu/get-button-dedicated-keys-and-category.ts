import { ActionButtonCategories, GameKey } from "./action-menu-button-properties";
import { GameAction, GameActionType } from "./game-actions";

export interface DedicatedKeysOptionAndCategory {
  dedicatedKeysOption: null | GameKey[];
  category: ActionButtonCategories;
}

export default function getButtonDedicatedKeyAndCategory(gameAction: GameAction) {
  switch (gameAction.type) {
    case GameActionType.SetInventoryOpen:
    case GameActionType.ToggleReadyToExplore:
    case GameActionType.ToggleReadyToDescend:
    case GameActionType.ToggleViewingEquipedItems:
    case GameActionType.SelectItem:
    case GameActionType.TakeItem:
    case GameActionType.UseItem:
    case GameActionType.DropItem:
    case GameActionType.ShardItem:
    case GameActionType.DeselectItem:
    case GameActionType.UseSelectedCombatAction:
    case GameActionType.SelectCombatAction:
    case GameActionType.DeselectCombatAction:
    case GameActionType.CycleTargets:
    case GameActionType.CycleTargetingScheme:
    case GameActionType.SetAssignAttributePointsMenuOpen:
    case GameActionType.AssignAttributePoint:
  }
}
