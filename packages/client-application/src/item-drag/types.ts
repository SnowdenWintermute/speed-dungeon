import { Item, TaggedEquipmentSlot } from "@speed-dungeon/common";

export enum DragSourceType {
  InventoryItem,
  EquippedItem,
  GroundItem,
}

export type DragSource =
  | { type: DragSourceType.InventoryItem; item: Item }
  // identified by slot alone; the Equipment is derived via equipment.getEquipmentInSlot(slot)
  | { type: DragSourceType.EquippedItem; slot: TaggedEquipmentSlot }
  | { type: DragSourceType.GroundItem; item: Item };

export enum DropTargetType {
  EquipmentSlot,
  Ground,
  Inventory,
}

export type DropTarget =
  | { type: DropTargetType.EquipmentSlot; slot: TaggedEquipmentSlot }
  | { type: DropTargetType.Ground }
  | { type: DropTargetType.Inventory };

export interface PointerPosition {
  x: number;
  y: number;
}

export function dropTargetsEqual(a: DropTarget, b: DropTarget) {
  if (a.type !== b.type) return false;
  if (a.type === DropTargetType.EquipmentSlot && b.type === DropTargetType.EquipmentSlot) {
    return a.slot.type === b.slot.type && a.slot.slot === b.slot.slot;
  }
  return true;
}
