import {
  Combatant,
  CombatantId,
  COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE,
  Equipment,
  EquipmentSlotId,
  EquipmentType,
  Item,
} from "@speed-dungeon/common";
import { ItemCommands } from "../item-commands";
import { DragSource, DragSourceType, DropTarget, DropTargetType } from "./types";

export enum DropResolutionType {
  // a legal drop; execute() dispatches the intent
  Valid,
  // a compatible target the item can't currently go to (unmet requirements / broken) — highlight red
  Blocked,
  // not a drop target for this source — no highlight, ignored on release
  Incompatible,
}

export type DropResolution =
  | { type: DropResolutionType.Valid; execute: () => void }
  | { type: DropResolutionType.Blocked }
  | { type: DropResolutionType.Incompatible };

const INCOMPATIBLE: DropResolution = { type: DropResolutionType.Incompatible };
const BLOCKED: DropResolution = { type: DropResolutionType.Blocked };

export function resolveDrop(
  source: DragSource,
  target: DropTarget,
  character: Combatant,
  itemCommands: ItemCommands
): DropResolution {
  const characterId = character.getEntityId();

  switch (source.type) {
    case DragSourceType.InventoryItem:
      return resolveInventoryItemDrop(source.item, target, character, characterId, itemCommands);
    case DragSourceType.EquippedItem:
      return resolveEquippedItemDrop(source.slotId, target, character, characterId, itemCommands);
    case DragSourceType.GroundItem:
      return resolveGroundItemDrop(source.item, target, character, characterId, itemCommands);
  }
}

function resolveInventoryItemDrop(
  item: Item,
  target: DropTarget,
  character: Combatant,
  characterId: CombatantId,
  itemCommands: ItemCommands
): DropResolution {
  switch (target.type) {
    case DropTargetType.EquipmentSlot:
      return resolveEquipToSlot(item, target.slotId, character, (equipment, alternate) =>
        itemCommands.equipItem(characterId, equipment.getEntityId(), { alternate })
      );
    case DropTargetType.Ground:
      return {
        type: DropResolutionType.Valid,
        execute: () => itemCommands.dropItem(characterId, item.getEntityId()),
      };
    case DropTargetType.Inventory:
      // already in the inventory
      return INCOMPATIBLE;
  }
}

function resolveEquippedItemDrop(
  slotId: EquipmentSlotId,
  target: DropTarget,
  character: Combatant,
  characterId: CombatantId,
  itemCommands: ItemCommands
): DropResolution {
  switch (target.type) {
    case DropTargetType.Inventory:
      return {
        type: DropResolutionType.Valid,
        execute: () => itemCommands.unequipSlot(characterId, slotId),
      };
    case DropTargetType.Ground:
      return {
        type: DropResolutionType.Valid,
        execute: () => itemCommands.dropEquippedItem(characterId, slotId),
      };
    case DropTargetType.EquipmentSlot:
      return resolveMoveToSlot(slotId, target.slotId, character, (sourceSlot, destinationSlot) =>
        itemCommands.moveEquippedItemToSlot(characterId, sourceSlot, destinationSlot)
      );
  }
}

function resolveMoveToSlot(
  sourceSlotId: EquipmentSlotId,
  destinationSlotId: EquipmentSlotId,
  character: Combatant,
  move: (sourceSlotId: EquipmentSlotId, destinationSlotId: EquipmentSlotId) => void
): DropResolution {
  if (sourceSlotId === destinationSlotId) {
    return INCOMPATIBLE;
  }

  const combatantEquipment = character.combatantProperties.equipment;

  const item = combatantEquipment.getEquipmentInSlot(sourceSlotId);
  if (item === null) {
    return INCOMPATIBLE;
  }

  const { equipmentType } = item.equipmentBaseItemProperties;
  const destinationSlot = combatantEquipment.getSlotById(destinationSlotId);
  if (!destinationSlot.canAcceptEquipmentType(equipmentType)) {
    return INCOMPATIBLE;
  }

  return {
    type: DropResolutionType.Valid,
    execute: () => move(sourceSlotId, destinationSlotId),
  };
}

function resolveGroundItemDrop(
  item: Item,
  target: DropTarget,
  character: Combatant,
  characterId: CombatantId,
  itemCommands: ItemCommands
): DropResolution {
  switch (target.type) {
    case DropTargetType.Inventory:
      return {
        type: DropResolutionType.Valid,
        execute: () => itemCommands.pickUpItems(characterId, [item.getEntityId()]),
      };
    case DropTargetType.EquipmentSlot:
      return resolveEquipToSlot(item, target.slotId, character, (equipment, alternate) =>
        itemCommands.equipItemFromGround(characterId, equipment.getEntityId(), { alternate })
      );
    case DropTargetType.Ground:
      // already on the ground
      return INCOMPATIBLE;
  }
}

// Shared by the inventory and ground sources: an equipment slot accepts an item on identical terms
// no matter where the item is coming from; only the dispatched command differs.
function resolveEquipToSlot(
  item: Item,
  slotId: EquipmentSlotId,
  character: Combatant,
  equip: (equipment: Equipment, alternate: boolean) => void
): DropResolution {
  if (!(item instanceof Equipment)) {
    return INCOMPATIBLE;
  }

  const alternate = equipToAlternateForSlot(item.equipmentBaseItemProperties.equipmentType, slotId);
  if (alternate === null) {
    return INCOMPATIBLE;
  }

  if (character.combatantProperties.equipment.canEquip(item) instanceof Error) {
    return BLOCKED;
  }

  return {
    type: DropResolutionType.Valid,
    execute: () => equip(item, alternate),
  };
}

// which of an equipment type's slots the target is: false = main, true = alternate, null = incompatible
function equipToAlternateForSlot(
  equipmentType: EquipmentType,
  targetSlotId: EquipmentSlotId
): boolean | null {
  const slots = COMPATIBLE_SLOT_IDS_BY_EQUIPMENT_TYPE[equipmentType];

  if (slots.main === targetSlotId) {
    return false;
  }
  if (slots.alternate !== null && slots.alternate === targetSlotId) {
    return true;
  }
  return null;
}
