import {
  CombatAttribute,
  EquipmentBaseItem,
  EquipmentType,
  HpChangeSource,
  HpChangeSourceCategory,
  KineticDamageType,
  MeleeOrRanged,
  NumberRange,
  PrefixType,
  SuffixType,
  TwoHandedRangedWeapon,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { WeaponGenerationTemplate } from "./equipment-generation-template-abstract-classes.js";

export class TwoHandedRangedWeaponGenerationTemplate extends WeaponGenerationTemplate {
  constructor(
    public damage: NumberRange,
    public possibleDamageClassifications: HpChangeSource[],
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    if (equipmentBaseItem.equipmentType !== EquipmentType.TwoHandedRangedWeapon)
      throw new Error("invalid base item provided");

    super(damage, possibleDamageClassifications, equipmentBaseItem);
    for (const prefix of iterateNumericEnum(PrefixType)) {
      switch (prefix) {
        case PrefixType.Mp:
        case PrefixType.ArmorClass:
        case PrefixType.Evasion:
          break;
        case PrefixType.Accuracy:
        case PrefixType.PercentDamage:
        case PrefixType.LifeSteal:
        case PrefixType.Resilience:
        case PrefixType.ArmorPenetration:
        case PrefixType.Agility:
        case PrefixType.Focus:
          this.possibleAffixes.prefix[prefix] = 5;
      }
    }
    for (const suffix of iterateNumericEnum(SuffixType)) {
      switch (suffix) {
        case SuffixType.Hp:
          break;
        case SuffixType.AllBase:
          this.possibleAffixes.suffix[suffix] = 4;
          break;
        case SuffixType.Strength:
        case SuffixType.Intelligence:
        case SuffixType.Dexterity:
        case SuffixType.Vitality:
        case SuffixType.Damage:
        case SuffixType.Durability:
          this.possibleAffixes.suffix[suffix] = 5;
      }
    }
  }
}

export const TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES: Record<
  TwoHandedRangedWeapon,
  TwoHandedRangedWeaponGenerationTemplate
> = (() => {
  const toReturn: Partial<Record<TwoHandedRangedWeapon, TwoHandedRangedWeaponGenerationTemplate>> =
    {};

  for (const weapon of iterateNumericEnum(TwoHandedRangedWeapon)) {
    const template = new TwoHandedRangedWeaponGenerationTemplate(new NumberRange(1, 3), [], {
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: weapon,
    });
    const mainDamageClassification: null | HpChangeSource = new HpChangeSource(
      HpChangeSourceCategory.Physical,
      MeleeOrRanged.Ranged,
      KineticDamageType.Piercing
    );

    switch (weapon) {
      case TwoHandedRangedWeapon.ShortBow:
        template.levelRange = new NumberRange(1, 4);
        template.damage = new NumberRange(2, 7);
        template.requirements[CombatAttribute.Dexterity] = 2;
        break;
      case TwoHandedRangedWeapon.RecurveBow:
        template.levelRange = new NumberRange(3, 6);
        template.damage = new NumberRange(5, 10);
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.requirements[CombatAttribute.Strength] = 3;
        break;
      case TwoHandedRangedWeapon.CompositeBow:
        template.levelRange = new NumberRange(5, 8);
        template.damage = new NumberRange(8, 16);
        template.requirements[CombatAttribute.Dexterity] = 13;
        template.requirements[CombatAttribute.Strength] = 7;
        break;
      case TwoHandedRangedWeapon.MilitaryBow:
        template.levelRange = new NumberRange(8, 10);
        template.damage = new NumberRange(12, 26);
        template.requirements[CombatAttribute.Dexterity] = 25;
        template.requirements[CombatAttribute.Strength] = 13;
        break;
      case TwoHandedRangedWeapon.EtherBow:
        template.levelRange = new NumberRange(7, 10);
        template.damage = new NumberRange(10, 22);
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.requirements[CombatAttribute.Intelligence] = 13;
        mainDamageClassification.category = HpChangeSourceCategory.Magical;
        break;
    }

    if (mainDamageClassification !== null)
      template.possibleDamageClassifications = [mainDamageClassification];
    toReturn[weapon] = template;
  }

  return toReturn as Record<TwoHandedRangedWeapon, TwoHandedRangedWeaponGenerationTemplate>;
})();
