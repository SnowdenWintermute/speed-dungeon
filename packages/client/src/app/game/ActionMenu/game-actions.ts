import { CombatAction, CombatAttribute, NextOrPrevious } from "@speed-dungeon/common";

export enum GameActionType {
  ToggleReadyToExplore,
  ToggleReadyToDescend,
  SetInventoryOpen,
  ToggleViewingEquipedItems,
  SelectItem, // item_id, number of this item if consumable
  OpenTreasureChest,
  PickUpItems,
  TakeItem,
  // Item Selected
  UseItem,
  DropItem,
  ShardItem,
  DeselectItem,
  // InCombat
  UseSelectedCombatAction,
  SelectCombatAction,
  DeselectCombatAction,
  CycleTargets,
  CycleTargetingScheme,
  SetAssignAttributePointsMenuOpen,
  AssignAttributePoint,
}

interface ToggleReadyToExplore {
  type: GameActionType.ToggleReadyToExplore;
}
interface ToggleReadyToDescend {
  type: GameActionType.ToggleReadyToDescend;
}
interface SetInventoryOpen {
  type: GameActionType.SetInventoryOpen;
  shouldBeOpen: boolean;
}
interface ToggleViewingEquipedItems {
  type: GameActionType.ToggleViewingEquipedItems;
}
interface SelectItem {
  type: GameActionType.SelectItem;
  itemId: string;
  stackSize: null | number;
}
interface TakeItem {
  type: GameActionType.TakeItem;
}
interface UseItem {
  type: GameActionType.UseItem;
  itemId: string;
}
interface DropItem {
  type: GameActionType.DropItem;
  itemId: string;
}
interface ShardItem {
  type: GameActionType.ShardItem;
  itemId: string;
}
interface DeselectItem {
  type: GameActionType.DeselectItem;
}
interface UseSelectedCombatAction {
  type: GameActionType.UseSelectedCombatAction;
}
interface SelectCombatAction {
  type: GameActionType.SelectCombatAction;
  combatAction: CombatAction;
}
interface DeselectCombatAction {
  type: GameActionType.DeselectCombatAction;
}
interface CycleTargets {
  type: GameActionType.CycleTargets;
  nextOrPrevious: NextOrPrevious;
}
interface CycleTargetingScheme {
  type: GameActionType.CycleTargetingScheme;
}
interface SetAssignAttributePointsMenuOpen {
  type: GameActionType.SetAssignAttributePointsMenuOpen;
  shouldBeOpen: boolean;
}
interface AssignAttributePoint {
  type: GameActionType.AssignAttributePoint;
  attribute: CombatAttribute;
}

export type GameAction =
  | ToggleReadyToExplore
  | ToggleReadyToDescend
  | SetInventoryOpen
  | ToggleViewingEquipedItems
  | SelectItem
  | TakeItem
  | UseItem
  | DropItem
  | ShardItem
  | DeselectItem
  | UseSelectedCombatAction
  | SelectCombatAction
  | DeselectCombatAction
  | CycleTargets
  | CycleTargetingScheme
  | SetAssignAttributePointsMenuOpen
  | AssignAttributePoint;
