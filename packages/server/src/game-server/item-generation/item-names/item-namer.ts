import {
  AffixType,
  Affixes,
  CONSUMABLE_TYPE_STRINGS,
  EquipmentType,
  ItemType,
  ONE_HANDED_MELEE_WEAPON_NAMES,
  formatBodyArmor,
  formatHeadGear,
  formatJewelry,
  formatShield,
  formatTwoHandedMeleeWeapon,
  formatTwoHandedRangedWeapon,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { TaggedBaseItem } from "../item-generation-builder.js";
import { getPrefixName } from "./get-prefix-name.js";
import { getSuffixName } from "./get-suffix-name.js";

export abstract class ItemNamer {
  buildItemName(baseItem: TaggedBaseItem, affixes: null | Affixes) {
    const prefixNames = [];
    const suffixNames = [];
    let baseItemName = "";
    switch (baseItem.type) {
      case ItemType.Equipment:
        switch (baseItem.baseItem.equipmentType) {
          case EquipmentType.BodyArmor:
            baseItemName = formatBodyArmor(baseItem.baseItem.baseItemType);
            break;
          case EquipmentType.HeadGear:
            baseItemName = formatHeadGear(baseItem.baseItem.baseItemType);
            break;
          case EquipmentType.Ring:
          case EquipmentType.Amulet:
            baseItemName = formatJewelry(baseItem.baseItem.baseItemType);
            break;
          case EquipmentType.OneHandedMeleeWeapon:
            baseItemName = ONE_HANDED_MELEE_WEAPON_NAMES[baseItem.baseItem.baseItemType];
            break;
          case EquipmentType.TwoHandedMeleeWeapon:
            baseItemName = formatTwoHandedMeleeWeapon(baseItem.baseItem.baseItemType);
            break;
          case EquipmentType.TwoHandedRangedWeapon:
            baseItemName = formatTwoHandedRangedWeapon(baseItem.baseItem.baseItemType);
            break;
          case EquipmentType.Shield:
            baseItemName = formatShield(baseItem.baseItem.baseItemType);
            break;
        }
        break;
      case ItemType.Consumable:
        baseItemName = CONSUMABLE_TYPE_STRINGS[baseItem.baseItem];
    }

    if (affixes !== null) {
      for (const [prefixType, affix] of iterateNumericEnumKeyedRecord(affixes[AffixType.Prefix])) {
        const name = getPrefixName(prefixType, affix.tier);
        prefixNames.push(name);
      }
      for (const [suffixType, affix] of iterateNumericEnumKeyedRecord(affixes[AffixType.Suffix])) {
        const name = getSuffixName(suffixType, affix.tier);
        suffixNames.push(name);
      }
    }

    // @TODO name items with more than 1 suffix and 1 prefix
    const firstPrefixName = prefixNames[0] ? prefixNames[0] + " " : "";
    const firstSuffixName = suffixNames[0] ? " of " + suffixNames[0] : "";

    return firstPrefixName + baseItemName + firstSuffixName;
  }
}
