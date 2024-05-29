import {
  ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES,
  CombatActionType,
  CombatantAbilityName,
  NextOrPrevious,
} from "@speed-dungeon/common";
import { GameAction, GameActionType } from "./game-actions";
import {
  ActionMenuRelevantInformation,
  MenuType,
} from "./collect-action-menu-relevant-information";

export default function createGameActions({
  menuTypes,
  equipmentIds,
  consumableIdsByType,
  abilities,
  selectedCombatActionPropertiesOption,
  inventoryIsOpen,
  selectedItemIdOption,
}: ActionMenuRelevantInformation) {
  const gameActions: GameAction[] = [];

  for (const menuType of menuTypes) {
    switch (menuType) {
      case MenuType.OutOfCombat:
        gameActions.push({ type: GameActionType.SetInventoryOpen, shouldBeOpen: !inventoryIsOpen });
        gameActions.push({ type: GameActionType.ToggleReadyToExplore });
        addAbilityGameActionsToList(gameActions, abilities);
        gameActions.push({
          type: GameActionType.SetAssignAttributePointsMenuOpen,
          shouldBeOpen: true,
        });
      case MenuType.UnopenedChest:
      case MenuType.ItemsOnGround:
      case MenuType.InCombat:
        addAbilityGameActionsToList(gameActions, abilities);
        gameActions.push({ type: GameActionType.SetInventoryOpen, shouldBeOpen: !inventoryIsOpen });
      case MenuType.CombatActionSelected:
        gameActions.push({ type: GameActionType.DeselectCombatAction });
        gameActions.push({
          type: GameActionType.CycleTargets,
          nextOrPrevious: NextOrPrevious.Previous,
        });
        gameActions.push({
          type: GameActionType.CycleTargets,
          nextOrPrevious: NextOrPrevious.Next,
        });
        gameActions.push({ type: GameActionType.UseSelectedCombatAction });
        if (
          selectedCombatActionPropertiesOption !== null &&
          selectedCombatActionPropertiesOption.targetingSchemes.length > 1
        ) {
          gameActions.push({ type: GameActionType.CycleTargetingScheme });
        }
      case MenuType.AssignAttributePoints:
        for (const attribute of ATTRIBUTE_POINT_ASSIGNABLE_ATTRIBUTES) {
          gameActions.push({ type: GameActionType.AssignAttributePoint, attribute });
        }
      case MenuType.InventoryOpen:
        gameActions.push({ type: GameActionType.SetInventoryOpen, shouldBeOpen: !inventoryIsOpen });
        gameActions.push({ type: GameActionType.ToggleViewingEquipedItems });
        for (const [consumableTypeKey, ids] of Object.entries(consumableIdsByType)) {
          gameActions.push({
            type: GameActionType.SelectItem,
            itemId: ids[0],
            stackSize: ids.length,
          });
        }
        for (const itemId of equipmentIds) {
          gameActions.push({
            type: GameActionType.SelectItem,
            itemId,
            stackSize: 1,
          });
        }
      case MenuType.ViewingEquipedItems:
        gameActions.push({ type: GameActionType.SetInventoryOpen, shouldBeOpen: !inventoryIsOpen });
        gameActions.push({ type: GameActionType.ToggleViewingEquipedItems });
        for (const itemId of equipmentIds) {
          gameActions.push({
            type: GameActionType.SelectItem,
            itemId,
            stackSize: 1,
          });
        }
      case MenuType.ItemSelected:
        gameActions.push({ type: GameActionType.DeselectItem });
        if (selectedItemIdOption) {
          gameActions.push({
            type: GameActionType.UseItem,
            itemId: selectedItemIdOption,
          });
          gameActions.push({
            type: GameActionType.ShardItem,
            itemId: selectedItemIdOption,
          });
          gameActions.push({
            type: GameActionType.DropItem,
            itemId: selectedItemIdOption,
          });
        }
      case MenuType.LevelUpAbilities:
      case MenuType.Staircase:
        gameActions.push({ type: GameActionType.ToggleReadyToDescend });
    }
  }

  return gameActions;
}

function addAbilityGameActionsToList(
  gameActions: GameAction[],
  abilityNames: CombatantAbilityName[]
) {
  for (const abilityName of abilityNames) {
    gameActions.push({
      type: GameActionType.SelectCombatAction,
      combatAction: { type: CombatActionType.AbilityUsed, abilityName },
    });
  }
}
