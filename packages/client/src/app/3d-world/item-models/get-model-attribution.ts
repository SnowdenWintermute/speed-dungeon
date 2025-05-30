import { Consumable, Equipment, EquipmentType, Item } from "@speed-dungeon/common";
import {
  ONE_HANDED_MELEE_WEAPON_MODELS,
  SHIELD_MODELS,
  TWO_HANDED_MELEE_WEAPON_MODELS,
  TWO_HANDED_RANGED_WEAPON_MODELS,
} from "./equipment-base-item-to-model-path";
import { CONSUMABLE_MODELS } from "./consumable-models";
import { ARTISTS } from "./artists";

export function getModelAttribution(item: Item) {
  if (item instanceof Equipment) {
    const { equipmentBaseItemProperties } = item;
    switch (equipmentBaseItemProperties.taggedBaseEquipment.equipmentType) {
      case EquipmentType.BodyArmor:
      case EquipmentType.HeadGear:
      case EquipmentType.Ring:
      case EquipmentType.Amulet:
        return undefined;
      case EquipmentType.OneHandedMeleeWeapon:
        const artist =
          ONE_HANDED_MELEE_WEAPON_MODELS[
            equipmentBaseItemProperties.taggedBaseEquipment.baseItemType
          ].artist;
        return ARTISTS[artist];
      case EquipmentType.TwoHandedMeleeWeapon:
        return ARTISTS[
          TWO_HANDED_MELEE_WEAPON_MODELS[
            equipmentBaseItemProperties.taggedBaseEquipment.baseItemType
          ].artist
        ];
      case EquipmentType.TwoHandedRangedWeapon:
        return ARTISTS[
          TWO_HANDED_RANGED_WEAPON_MODELS[
            equipmentBaseItemProperties.taggedBaseEquipment.baseItemType
          ].artist
        ];
      case EquipmentType.Shield:
        return ARTISTS[
          SHIELD_MODELS[equipmentBaseItemProperties.taggedBaseEquipment.baseItemType].artist
        ];
    }
  } else if (item instanceof Consumable) {
    const artist = CONSUMABLE_MODELS[item.consumableType].artist;

    return ARTISTS[artist];
  }
}
