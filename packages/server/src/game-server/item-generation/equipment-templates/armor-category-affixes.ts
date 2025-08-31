import { ArmorCategory, EquipmentType, AffixType } from "@speed-dungeon/common";

export function modifyPossibleAffixesByArmorCategory(
  possibleAffixes: {
    prefix: Partial<Record<AffixType, number>>;
    suffix: Partial<Record<AffixType, number>>;
  },
  armorType: EquipmentType.BodyArmor | EquipmentType.HeadGear,
  armorCategory: ArmorCategory
) {
  switch (armorCategory) {
    case ArmorCategory.Cloth:
      possibleAffixes.prefix[AffixType.Mp] = 5;
      possibleAffixes.suffix[AffixType.Spirit] = 5;
      break;
    case ArmorCategory.Leather:
      possibleAffixes.prefix[AffixType.Agility] = 5;
      possibleAffixes.prefix[AffixType.Evasion] = 5;
      possibleAffixes.suffix[AffixType.Dexterity] = 5;
      break;
    case ArmorCategory.Mail:
      possibleAffixes.prefix[AffixType.Mp] = 5;
      possibleAffixes.suffix[AffixType.Spirit] = 5;
      possibleAffixes.prefix[AffixType.Agility] = 5;
      possibleAffixes.prefix[AffixType.Evasion] = 5;
      possibleAffixes.suffix[AffixType.Dexterity] = 5;
      break;
    case ArmorCategory.Plate:
      delete possibleAffixes.prefix[AffixType.Agility];
      delete possibleAffixes.prefix[AffixType.Evasion];
      break;
  }

  if (armorType === EquipmentType.HeadGear) {
    switch (armorCategory) {
      case ArmorCategory.Cloth:
        // possibleAffixes.suffix[AffixType.AllBase] = 4;
        break;
      case ArmorCategory.Leather:
        possibleAffixes.prefix[AffixType.Accuracy] = 5;
        break;
      case ArmorCategory.Mail:
        possibleAffixes.prefix[AffixType.LifeSteal] = 5;
        break;
      case ArmorCategory.Plate:
        possibleAffixes.prefix[AffixType.ArmorPenetration] = 5;
        break;
    }
  }
}
