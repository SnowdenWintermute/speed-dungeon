import {
  Affixes,
  EquipmentType,
  ItemPropertiesType,
  PrefixType,
  SuffixType,
  formatBodyArmor,
  formatConsumableType,
  formatHeadGear,
  formatJewelry,
  formatOneHandedMeleeWeapon,
  formatShield,
  formatTwoHandedMeleeWeapon,
  formatTwoHandedRangedWeapon,
} from "@speed-dungeon/common";
import { TaggedBaseItem } from "../item-generation-builder";
import { getPrefixName } from "./get-prefix-name";
import { getSuffixName } from "./get-suffix-name";

export abstract class ItemNamer {
  buildItemName(baseItem: TaggedBaseItem, affixes: null | Affixes) {
    const prefixNames = [];
    const suffixNames = [];
    let baseItemName = "";
    switch (baseItem.type) {
      case ItemPropertiesType.Equipment:
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
            baseItemName = formatOneHandedMeleeWeapon(baseItem.baseItem.baseItemType);
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
      case ItemPropertiesType.Consumable:
        baseItemName = formatConsumableType(baseItem.baseItem);
    }

    if (affixes !== null) {
      for (const [key, affix] of Object.entries(affixes.prefixes)) {
        const prefixType = parseInt(key) as PrefixType;
        const name = getPrefixName(prefixType, affix.tier);
        prefixNames.push(name);
      }
      for (const [key, affix] of Object.entries(affixes.suffixes)) {
        const suffixType = parseInt(key) as SuffixType;
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
