import {
  AffixType,
  Affixes,
  CONSUMABLE_TYPE_STRINGS,
  EquipmentType,
  ItemType,
  ONE_HANDED_MELEE_WEAPON_NAMES,
  formatAmulet,
  formatBodyArmor,
  formatHeadGear,
  formatRing,
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
        switch (baseItem.taggedBaseEquipment.equipmentType) {
          case EquipmentType.BodyArmor:
            baseItemName = formatBodyArmor(baseItem.taggedBaseEquipment.baseItemType);
            break;
          case EquipmentType.HeadGear:
            baseItemName = formatHeadGear(baseItem.taggedBaseEquipment.baseItemType);
            break;
          case EquipmentType.Ring:
            baseItemName = formatRing(baseItem.taggedBaseEquipment.baseItemType);
            break;
          case EquipmentType.Amulet:
            baseItemName = formatAmulet(baseItem.taggedBaseEquipment.baseItemType);
            break;
          case EquipmentType.OneHandedMeleeWeapon:
            baseItemName = ONE_HANDED_MELEE_WEAPON_NAMES[baseItem.taggedBaseEquipment.baseItemType];
            break;
          case EquipmentType.TwoHandedMeleeWeapon:
            baseItemName = formatTwoHandedMeleeWeapon(baseItem.taggedBaseEquipment.baseItemType);
            break;
          case EquipmentType.TwoHandedRangedWeapon:
            baseItemName = formatTwoHandedRangedWeapon(baseItem.taggedBaseEquipment.baseItemType);
            break;
          case EquipmentType.Shield:
            baseItemName = formatShield(baseItem.taggedBaseEquipment.baseItemType);
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

    const firstPrefixName = prefixNames[0] ? prefixNames[0] + " " : "";
    const firstSuffixName = suffixNames[0] ? " of " + suffixNames[0] : "";

    return firstPrefixName + baseItemName + firstSuffixName;
  }
}
