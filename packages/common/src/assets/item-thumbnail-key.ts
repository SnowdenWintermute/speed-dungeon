import { MAGICAL_ELEMENT_STRINGS } from "../combat/magical-elements.js";
import { Item } from "../items/index.js";
import { Consumable } from "../items/consumables/index.js";
import { Equipment } from "../items/equipment/index.js";
import { equipmentBaseItemToAssetId } from "./equipment-model-paths.js";
import { consumableItemToAssetId } from "./consumable-model-paths.js";

/** Identifies everything about an item that changes how its model looks on screen, so two items
 * sharing one are guaranteed to render the same picture. Null when the item has no model. */
export type ItemThumbnailKey = string & { __brand: "ItemThumbnailKey" };

export function getItemThumbnailKeyOption(item: Item): null | ItemThumbnailKey {
  if (item instanceof Consumable) {
    const assetId = consumableItemToAssetId(item.consumableType);
    if (assetId === null) {
      return null;
    }
    return `${assetId}:${item.consumableType}` as ItemThumbnailKey;
  }

  if (item instanceof Equipment) {
    const assetId = equipmentBaseItemToAssetId(item.equipmentBaseItemProperties);
    if (assetId === null) {
      return null;
    }
    // the base item is part of the key because two of them can share a model and be given
    // different materials, as the bo staff and the elemental staff do
    const { equipmentType, baseItemType } = item.equipmentBaseItemProperties;
    return `${assetId}:${equipmentType}-${baseItemType}:${getElementSegment(
      item
    )}` as ItemThumbnailKey;
  }

  throw new Error("Item was not a known item instance type");
}

// materials are assigned to a weapon's accent slots by the position of each damage
// classification, so both which elements are present and their order matter
function getElementSegment(equipment: Equipment) {
  if (!equipment.isWeapon()) {
    return "";
  }

  const weaponProperties = equipment.requireWeaponProperties();

  return weaponProperties.damageClassification
    .map(({ elementOption }) =>
      elementOption === undefined ? "none" : MAGICAL_ELEMENT_STRINGS[elementOption]
    )
    .join(",");
}
