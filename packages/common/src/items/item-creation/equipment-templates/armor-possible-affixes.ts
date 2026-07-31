import { AffixType, PREFIX_TYPES, SUFFIX_TYPES } from "../../equipment/affixes.js";
import { ArmorCategory } from "../../equipment/equipment-properties/armor-properties.js";
import { EquipmentType } from "../../equipment/equipment-types/index.js";

interface PossibleAffixes {
  prefix: Partial<Record<AffixType, number>>;
  suffix: Partial<Record<AffixType, number>>;
}

/** the category pass reads as deltas against the generic set — it deletes affixes the generic set
 * granted — so the two only make sense applied together */
export function setArmorPossibleAffixes(
  possibleAffixes: PossibleAffixes,
  armorType: EquipmentType.BodyArmor | EquipmentType.HeadGear,
  armorCategory: ArmorCategory
) {
  setGenericArmorPossibleAffixes(possibleAffixes);
  modifyPossibleAffixesByArmorCategory(possibleAffixes, armorType, armorCategory);
}

function setGenericArmorPossibleAffixes(possibleAffixes: PossibleAffixes) {
  for (const prefix of PREFIX_TYPES) {
    switch (prefix) {
      case AffixType.PercentDamage:
      case AffixType.Accuracy:
      case AffixType.LifeSteal:
      case AffixType.ArmorPenetration:
        break;
      case AffixType.Mp:
      case AffixType.Evasion:
      case AffixType.Agility:
        possibleAffixes.prefix[prefix] = 3;
        break;
      case AffixType.FlatArmorClass:
        possibleAffixes.prefix[prefix] = 5;
    }
  }
  for (const suffix of SUFFIX_TYPES) {
    switch (suffix) {
      case AffixType.FlatDamage:
        break;
      case AffixType.Spirit:
      case AffixType.Dexterity:
        possibleAffixes.suffix[suffix] = 3;
        break;
      case AffixType.Hp:
      case AffixType.Strength:
      case AffixType.Vitality:
      case AffixType.Durability:
      case AffixType.PercentArmorClass:
        possibleAffixes.suffix[suffix] = 5;
    }
  }
}

function modifyPossibleAffixesByArmorCategory(
  possibleAffixes: PossibleAffixes,
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
