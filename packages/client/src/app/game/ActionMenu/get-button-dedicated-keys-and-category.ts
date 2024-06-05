import { NextOrPrevious } from "@speed-dungeon/common";
import { ActionButtonCategory, GameKey } from "./action-menu-button-properties";
import { GameAction, GameActionType } from "./game-actions";

export interface DedicatedKeysOptionAndCategory {
  dedicatedKeysOption: null | GameKey[];
  category: ActionButtonCategory;
}

export default function getButtonDedicatedKeyAndCategory(
  gameAction: GameAction
): DedicatedKeysOptionAndCategory {
  let dedicatedKeysOption: null | GameKey[] = null;
  let category = ActionButtonCategory.Top;

  switch (gameAction.type) {
    case GameActionType.SetInventoryOpen:
      if (gameAction.shouldBeOpen) dedicatedKeysOption = [GameKey.S, GameKey.I];
      else dedicatedKeysOption = [GameKey.Cancel, GameKey.S, GameKey.I];
      break;
    case GameActionType.SetAssignAttributePointsMenuOpen:
      if (gameAction.shouldBeOpen) dedicatedKeysOption = [GameKey.F, GameKey.P];
      else dedicatedKeysOption = [GameKey.Cancel, GameKey.F, GameKey.P];
      break;
    case GameActionType.CycleTargetingScheme:
      dedicatedKeysOption = [GameKey.T];
      break;
    case GameActionType.ToggleViewingEquipedItems:
      dedicatedKeysOption = [GameKey.D, GameKey.O];
      break;
    case GameActionType.UseItem:
      dedicatedKeysOption = [GameKey.Confirm];
      break;
    case GameActionType.DeselectItem:
      dedicatedKeysOption = [GameKey.Cancel];
      break;
    case GameActionType.UseSelectedCombatAction:
      dedicatedKeysOption = [GameKey.Confirm];
      break;
    case GameActionType.DeselectCombatAction:
      dedicatedKeysOption = [GameKey.Cancel];
      break;
    case GameActionType.CycleTargets:
      category = ActionButtonCategory.NextPrevious;
      switch (gameAction.nextOrPrevious) {
        case NextOrPrevious.Next:
          dedicatedKeysOption = [GameKey.Next];
          break;
        case NextOrPrevious.Previous:
          dedicatedKeysOption = [GameKey.Previous];
          break;
      }
      break;
    default:
      dedicatedKeysOption = null;
      category = ActionButtonCategory.Numbered;
  }

  return { dedicatedKeysOption, category };
}
