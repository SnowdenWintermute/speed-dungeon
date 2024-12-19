import {
  Consumable,
  Equipment,
  EquipmentType,
  Item,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";
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
    switch (equipmentBaseItemProperties.type) {
      case EquipmentType.BodyArmor:
      case EquipmentType.HeadGear:
      case EquipmentType.Ring:
      case EquipmentType.Amulet:
        return undefined;
      case EquipmentType.OneHandedMeleeWeapon:
        const artist =
          ONE_HANDED_MELEE_WEAPON_MODELS[
            equipmentBaseItemProperties.baseItem as OneHandedMeleeWeapon
          ].artist;
        return ARTISTS[artist];
      case EquipmentType.TwoHandedMeleeWeapon:
        return ARTISTS[
          TWO_HANDED_MELEE_WEAPON_MODELS[
            equipmentBaseItemProperties.baseItem as TwoHandedMeleeWeapon
          ].artist
        ];
      case EquipmentType.TwoHandedRangedWeapon:
        return ARTISTS[
          TWO_HANDED_RANGED_WEAPON_MODELS[
            equipmentBaseItemProperties.baseItem as TwoHandedRangedWeapon
          ].artist
        ];
      case EquipmentType.Shield:
        return ARTISTS[SHIELD_MODELS[equipmentBaseItemProperties.baseItem].artist];
    }
  } else if (item instanceof Consumable) {
    const artist = CONSUMABLE_MODELS[item.consumableType].artist;

    return ARTISTS[artist];
  }
}
