import { Item } from "../items/index.js";
import { Consumable } from "../items/consumables/index.js";
import { Equipment } from "../items/equipment/index.js";
import { EquipmentType } from "../items/equipment/equipment-types/index.js";
import {
  ONE_HANDED_MELEE_WEAPON_MODELS,
  SHIELD_MODELS,
  TWO_HANDED_MELEE_WEAPON_MODELS,
  TWO_HANDED_RANGED_WEAPON_MODELS,
} from "./equipment-model-paths.js";
import { CONSUMABLE_MODELS } from "./consumable-model-paths.js";
import { ARTISTS } from "./artists.js";

export function getModelAttribution(item: Item) {
  if (item instanceof Equipment) {
    const { equipmentBaseItemProperties } = item;
    switch (equipmentBaseItemProperties.equipmentType) {
      case EquipmentType.BodyArmor:
      case EquipmentType.HeadGear:
      case EquipmentType.Ring:
      case EquipmentType.Amulet:
        return undefined;
      case EquipmentType.OneHandedMeleeWeapon:
        return ARTISTS[
          ONE_HANDED_MELEE_WEAPON_MODELS[equipmentBaseItemProperties.baseItemType].artist
        ];
      case EquipmentType.TwoHandedMeleeWeapon:
        return ARTISTS[
          TWO_HANDED_MELEE_WEAPON_MODELS[equipmentBaseItemProperties.baseItemType].artist
        ];
      case EquipmentType.TwoHandedRangedWeapon:
        return ARTISTS[
          TWO_HANDED_RANGED_WEAPON_MODELS[equipmentBaseItemProperties.baseItemType].artist
        ];
      case EquipmentType.Shield:
        return ARTISTS[SHIELD_MODELS[equipmentBaseItemProperties.baseItemType].artist];
    }
  } else if (item instanceof Consumable) {
    const artist = CONSUMABLE_MODELS[item.consumableType].artist;

    return ARTISTS[artist];
  }
}
