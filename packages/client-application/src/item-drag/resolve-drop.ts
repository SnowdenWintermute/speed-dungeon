import {
  Combatant,
  CombatantId,
  Equipment,
  EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE,
  equipmentTypeCanGoInSlot,
  EquipmentType,
  Item,
  taggedEquipmentSlotsAreEqual,
  TaggedEquipmentSlot,
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
      return resolveEquippedItemDrop(source.slot, target, character, characterId, itemCommands);
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
      return resolveEquipToSlot(item, target.slot, character, (equipment, alternate) =>
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
  slot: TaggedEquipmentSlot,
  target: DropTarget,
  character: Combatant,
  characterId: CombatantId,
  itemCommands: ItemCommands
): DropResolution {
  switch (target.type) {
    case DropTargetType.Inventory:
      return {
        type: DropResolutionType.Valid,
        execute: () => itemCommands.unequipSlot(characterId, slot),
      };
    case DropTargetType.Ground:
      return {
        type: DropResolutionType.Valid,
        execute: () => itemCommands.dropEquippedItem(characterId, slot),
      };
    case DropTargetType.EquipmentSlot:
      return resolveMoveToSlot(slot, target.slot, character, (sourceSlot, destinationSlot) =>
        itemCommands.moveEquippedItemToSlot(characterId, sourceSlot, destinationSlot)
      );
  }
}

// an equipped item dragged onto another of its legal slots moves there. Whatever is in the way
// either trades places with it or is unequipped into the inventory, decided by the domain model.
function resolveMoveToSlot(
  sourceSlot: TaggedEquipmentSlot,
  destinationSlot: TaggedEquipmentSlot,
  character: Combatant,
  move: (sourceSlot: TaggedEquipmentSlot, destinationSlot: TaggedEquipmentSlot) => void
): DropResolution {
  if (taggedEquipmentSlotsAreEqual(sourceSlot, destinationSlot)) {
    return INCOMPATIBLE;
  }

  const item = character.combatantProperties.equipment.getEquipmentInSlot(sourceSlot);
  if (item === undefined) {
    return INCOMPATIBLE;
  }

  const { equipmentType } = item.equipmentBaseItemProperties;
  if (!equipmentTypeCanGoInSlot(equipmentType, destinationSlot)) {
    return INCOMPATIBLE;
  }

  return {
    type: DropResolutionType.Valid,
    execute: () => move(sourceSlot, destinationSlot),
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
      return resolveEquipToSlot(item, target.slot, character, (equipment, alternate) =>
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
  slot: TaggedEquipmentSlot,
  character: Combatant,
  equip: (equipment: Equipment, alternate: boolean) => void
): DropResolution {
  if (!(item instanceof Equipment)) {
    return INCOMPATIBLE;
  }

  const alternate = equipToAlternateForSlot(item.equipmentBaseItemProperties.equipmentType, slot);
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
  targetSlot: TaggedEquipmentSlot
): boolean | null {
  const slots = EQUIPABLE_SLOTS_BY_EQUIPMENT_TYPE[equipmentType];
  if (taggedEquipmentSlotsAreEqual(slots.main, targetSlot)) {
    return false;
  }
  if (slots.alternate !== null && taggedEquipmentSlotsAreEqual(slots.alternate, targetSlot)) {
    return true;
  }
  return null;
}
