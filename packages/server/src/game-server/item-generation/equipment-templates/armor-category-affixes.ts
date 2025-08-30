import { ArmorCategory, EquipmentType, PrefixType, SuffixType } from "@speed-dungeon/common";

export function modifyPossibleAffixesByArmorCategory(
  possibleAffixes: {
    prefix: Partial<Record<PrefixType, number>>;
    suffix: Partial<Record<PrefixType, number>>;
  },
  armorType: EquipmentType.BodyArmor | EquipmentType.HeadGear,
  armorCategory: ArmorCategory
) {
  switch (armorCategory) {
    case ArmorCategory.Cloth:
      possibleAffixes.prefix[PrefixType.Mp] = 5;
      possibleAffixes.suffix[SuffixType.Spirit] = 5;
      break;
    case ArmorCategory.Leather:
      possibleAffixes.prefix[PrefixType.Agility] = 5;
      possibleAffixes.prefix[PrefixType.Evasion] = 5;
      possibleAffixes.suffix[SuffixType.Dexterity] = 5;
      break;
    case ArmorCategory.Mail:
      possibleAffixes.prefix[PrefixType.Mp] = 5;
      possibleAffixes.suffix[SuffixType.Spirit] = 5;
      possibleAffixes.prefix[PrefixType.Agility] = 5;
      possibleAffixes.prefix[PrefixType.Evasion] = 5;
      possibleAffixes.suffix[SuffixType.Dexterity] = 5;
      break;
    case ArmorCategory.Plate:
      delete possibleAffixes.prefix[PrefixType.Agility];
      delete possibleAffixes.prefix[PrefixType.Evasion];
      break;
  }

  if (armorType === EquipmentType.HeadGear) {
    switch (armorCategory) {
      case ArmorCategory.Cloth:
        possibleAffixes.suffix[SuffixType.AllBase] = 4;
        break;
      case ArmorCategory.Leather:
        possibleAffixes.prefix[PrefixType.Accuracy] = 5;
        break;
      case ArmorCategory.Mail:
        possibleAffixes.prefix[PrefixType.LifeSteal] = 5;
        break;
      case ArmorCategory.Plate:
        possibleAffixes.prefix[PrefixType.ArmorPenetration] = 5;
        break;
    }
  }
}
