import {
  CombatAttribute,
  EquipmentBaseItem,
  EquipmentType,
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  KineticDamageType,
  MagicalElement,
  NumberRange,
  AffixType,
  TwoHandedMeleeWeapon,
  iterateNumericEnum,
  SUFFIX_TYPES,
  PREFIX_TYPES,
} from "@speed-dungeon/common";
import { WeaponGenerationTemplate } from "./equipment-generation-template-abstract-classes.js";

export class TwoHandedMeleeWeaponGenerationTemplate extends WeaponGenerationTemplate {
  constructor(
    public damage: NumberRange,
    public possibleDamageClassifications: ResourceChangeSource[],
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    if (equipmentBaseItem.equipmentType !== EquipmentType.TwoHandedMeleeWeapon)
      throw new Error("invalid base item provided");

    super(damage, possibleDamageClassifications, equipmentBaseItem);
    for (const prefix of PREFIX_TYPES) {
      switch (prefix) {
        case AffixType.Mp:
        case AffixType.FlatArmorClass:
        case AffixType.Evasion:
          break;
        case AffixType.Accuracy:
        case AffixType.PercentDamage:
        case AffixType.LifeSteal:
        case AffixType.ArmorPenetration:
        case AffixType.Agility:
          this.possibleAffixes.prefix[prefix] = 5;
      }
    }
    for (const suffix of SUFFIX_TYPES) {
      switch (suffix) {
        case AffixType.Hp:
          break;
        case AffixType.AllBase:
          this.possibleAffixes.suffix[suffix] = 4;
          break;
        case AffixType.Strength:
        case AffixType.Spirit:
        case AffixType.Dexterity:
        case AffixType.Vitality:
        case AffixType.FlatDamage:
        case AffixType.Durability:
          this.possibleAffixes.suffix[suffix] = 5;
      }
    }
  }
}

export const TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES: Record<
  TwoHandedMeleeWeapon,
  TwoHandedMeleeWeaponGenerationTemplate
> = (() => {
  const toReturn: Partial<Record<TwoHandedMeleeWeapon, TwoHandedMeleeWeaponGenerationTemplate>> =
    {};

  for (const weapon of iterateNumericEnum(TwoHandedMeleeWeapon)) {
    const template = new TwoHandedMeleeWeaponGenerationTemplate(new NumberRange(1, 3), [], {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: weapon,
    });
    let mainDamageClassification: null | ResourceChangeSource = new ResourceChangeSource({
      category: ResourceChangeSourceCategory.Physical,
      kineticDamageTypeOption: KineticDamageType.Blunt,
    });

    switch (weapon) {
      case TwoHandedMeleeWeapon.RottingBranch:
        template.levelRange = new NumberRange(0, 0);
        template.damage = new NumberRange(1, 7);
        template.maxDurability = 4;
        break;
      case TwoHandedMeleeWeapon.BoStaff:
        template.levelRange = new NumberRange(1, 3);
        template.damage = new NumberRange(2, 8);
        template.maxDurability = 6;
        break;
      case TwoHandedMeleeWeapon.Spear:
        template.levelRange = new NumberRange(2, 5);
        template.damage = new NumberRange(3, 9);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Piercing;
        template.requirements[CombatAttribute.Dexterity] = 5;
        template.requirements[CombatAttribute.Strength] = 2;
        template.maxDurability = 9;
        break;
      case TwoHandedMeleeWeapon.Bardiche:
        template.levelRange = new NumberRange(2, 5);
        template.damage = new NumberRange(1, 11);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Slashing;
        template.requirements[CombatAttribute.Strength] = 9;
        template.maxDurability = 10;
        break;
      case TwoHandedMeleeWeapon.SplittingMaul:
        template.levelRange = new NumberRange(3, 6);
        template.damage = new NumberRange(6, 12);
        mainDamageClassification = null;
        template.numDamageClassifications = 2;
        template.possibleDamageClassifications = [
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Slashing,
          }),
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Blunt,
          }),
        ];
        template.requirements[CombatAttribute.Strength] = 11;
        template.requirements[CombatAttribute.Dexterity] = 5;
        template.maxDurability = 11;
        break;
      case TwoHandedMeleeWeapon.Maul:
        template.levelRange = new NumberRange(5, 7);
        template.damage = new NumberRange(9, 14);
        template.requirements[CombatAttribute.Strength] = 16;
        template.maxDurability = 18;
        break;
      case TwoHandedMeleeWeapon.BattleAxe:
        template.levelRange = new NumberRange(5, 7);
        template.damage = new NumberRange(6, 15);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Slashing;
        template.requirements[CombatAttribute.Strength] = 13;
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.maxDurability = 19;
        break;
      case TwoHandedMeleeWeapon.Glaive:
        template.levelRange = new NumberRange(6, 8);
        template.damage = new NumberRange(8, 17);
        mainDamageClassification = null;
        template.numDamageClassifications = 2;
        template.possibleDamageClassifications = [
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Slashing,
          }),
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Piercing,
          }),
        ];
        template.requirements[CombatAttribute.Dexterity] = 15;
        template.requirements[CombatAttribute.Strength] = 9;
        template.maxDurability = 15;
        break;
      case TwoHandedMeleeWeapon.ElementalStaff:
        template.levelRange = new NumberRange(7, 9);
        template.damage = new NumberRange(10, 18);
        mainDamageClassification = null;
        template.numDamageClassifications = 2;
        template.possibleDamageClassifications = iterateNumericEnum(MagicalElement)
          .filter((element) => element !== MagicalElement.Dark && element !== MagicalElement.Light)
          .map(
            (element) =>
              new ResourceChangeSource({
                category: ResourceChangeSourceCategory.Physical,
                kineticDamageTypeOption: KineticDamageType.Blunt,
                elementOption: element,
              })
          );
        template.requirements[CombatAttribute.Spirit] = 7;
        template.requirements[CombatAttribute.Strength] = 7;
        template.maxDurability = 18;
        break;
      case TwoHandedMeleeWeapon.Trident:
        template.levelRange = new NumberRange(8, 10);
        template.damage = new NumberRange(14, 26);
        mainDamageClassification = null;
        template.numDamageClassifications = 2;
        template.possibleDamageClassifications = [
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Magical,
            elementOption: MagicalElement.Water,
          }),
          new ResourceChangeSource({
            category: ResourceChangeSourceCategory.Physical,
            kineticDamageTypeOption: KineticDamageType.Piercing,
          }),
        ];
        template.requirements[CombatAttribute.Spirit] = 7;
        template.requirements[CombatAttribute.Strength] = 7;
        template.maxDurability = 20;
        break;
      case TwoHandedMeleeWeapon.GreatAxe:
        template.levelRange = new NumberRange(9, 10);
        template.damage = new NumberRange(15, 35);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Slashing;
        template.requirements[CombatAttribute.Strength] = 23;
        template.requirements[CombatAttribute.Dexterity] = 11;
        template.maxDurability = 28;
        break;
      case TwoHandedMeleeWeapon.GravityHammer:
        template.levelRange = new NumberRange(9, 10);
        template.damage = new NumberRange(20, 30);
        template.requirements[CombatAttribute.Strength] = 30;
        template.maxDurability = 40;
        break;
      case TwoHandedMeleeWeapon.ElmStaff:
        template.levelRange = new NumberRange(3, 6);
        template.damage = new NumberRange(4, 12);
        template.requirements[CombatAttribute.Spirit] = 10;
        template.maxDurability = 12;
        break;
      case TwoHandedMeleeWeapon.MahoganyStaff:
        template.levelRange = new NumberRange(5, 8);
        template.damage = new NumberRange(8, 22);
        template.requirements[CombatAttribute.Spirit] = 15;
        template.maxDurability = 16;
        break;
      case TwoHandedMeleeWeapon.EbonyStaff:
        template.levelRange = new NumberRange(8, 10);
        template.damage = new NumberRange(10, 32);
        template.requirements[CombatAttribute.Spirit] = 25;
        template.maxDurability = 22;
        break;
    }

    switch (weapon) {
      case TwoHandedMeleeWeapon.ElmStaff:
      case TwoHandedMeleeWeapon.MahoganyStaff:
      case TwoHandedMeleeWeapon.EbonyStaff:
        delete template.possibleAffixes.prefix[AffixType.Accuracy];
        delete template.possibleAffixes.prefix[AffixType.ArmorPenetration];
        delete template.possibleAffixes.prefix[AffixType.PercentDamage];
        delete template.possibleAffixes.suffix[AffixType.FlatDamage];
        delete template.possibleAffixes.suffix[AffixType.Dexterity];
        delete template.possibleAffixes.suffix[AffixType.Strength];
        template.possibleAffixes.prefix[AffixType.Mp] = 5;
        break;
      default:
    }

    if (mainDamageClassification !== null)
      template.possibleDamageClassifications = [mainDamageClassification];
    toReturn[weapon] = template;
  }

  return toReturn as Record<TwoHandedMeleeWeapon, TwoHandedMeleeWeaponGenerationTemplate>;
})();
