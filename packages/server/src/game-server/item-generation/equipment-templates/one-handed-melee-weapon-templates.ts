import {
  CombatAttribute,
  EquipmentBaseItem,
  EquipmentType,
  HpChangeSource,
  HpChangeSourceCategory,
  KineticDamageType,
  MagicalElement,
  MeleeOrRanged,
  NumberRange,
  OneHandedMeleeWeapon,
  PrefixType,
  SuffixType,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { WeaponGenerationTemplate } from "./equipment-generation-template-abstract-classes.js";

export class OneHandedMeleeWeaponGenerationTemplate extends WeaponGenerationTemplate {
  constructor(
    public damage: NumberRange,
    public possibleDamageClassifications: HpChangeSource[],
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    if (equipmentBaseItem.equipmentType !== EquipmentType.OneHandedMeleeWeapon)
      throw new Error("invalid base item provided");

    super(damage, possibleDamageClassifications, equipmentBaseItem);
    for (const prefix of iterateNumericEnum(PrefixType)) {
      switch (prefix) {
        case PrefixType.Mp:
        case PrefixType.ArmorClass:
        case PrefixType.Resilience:
        case PrefixType.Evasion:
          break;
        case PrefixType.Accuracy:
        case PrefixType.PercentDamage:
        case PrefixType.LifeSteal:
        case PrefixType.ArmorPenetration:
        case PrefixType.Agility:
        case PrefixType.Focus:
          this.possibleAffixes.prefix[prefix] = 5;
      }
    }
    for (const suffix of iterateNumericEnum(SuffixType)) {
      switch (suffix) {
        case SuffixType.Hp:
        case SuffixType.Vitality:
          break;
        case SuffixType.AllBase:
          this.possibleAffixes.suffix[suffix] = 3;
          break;
        case SuffixType.Strength:
        case SuffixType.Intelligence:
        case SuffixType.Dexterity:
        case SuffixType.Damage:
        case SuffixType.Durability:
          this.possibleAffixes.suffix[suffix] = 5;
      }
    }
  }
}

export const ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES: Record<
  OneHandedMeleeWeapon,
  OneHandedMeleeWeaponGenerationTemplate
> = (() => {
  const toReturn: Partial<Record<OneHandedMeleeWeapon, OneHandedMeleeWeaponGenerationTemplate>> =
    {};

  for (const weapon of iterateNumericEnum(OneHandedMeleeWeapon)) {
    const template = new OneHandedMeleeWeaponGenerationTemplate(new NumberRange(1, 3), [], {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: weapon,
    });
    let mainDamageClassification: null | HpChangeSource = new HpChangeSource(
      HpChangeSourceCategory.Physical,
      MeleeOrRanged.Melee,
      KineticDamageType.Blunt
    );

    switch (weapon) {
      case OneHandedMeleeWeapon.Stick:
        template.levelRange = new NumberRange(0, 0);
        break;
      case OneHandedMeleeWeapon.Club:
        template.levelRange = new NumberRange(1, 3);
        template.damage = new NumberRange(1, 4);
        template.maxDurability = 8;
        break;
      case OneHandedMeleeWeapon.Mace:
        template.levelRange = new NumberRange(2, 5);
        template.damage = new NumberRange(1, 8);
        template.requirements[CombatAttribute.Strength] = 10;
        template.maxDurability = 12;
        break;
      case OneHandedMeleeWeapon.Morningstar:
        template.levelRange = new NumberRange(4, 8);
        template.damage = new NumberRange(2, 12);
        template.requirements[CombatAttribute.Strength] = 14;
        template.maxDurability = 14;
        break;
      case OneHandedMeleeWeapon.WarHammer:
        template.levelRange = new NumberRange(8, 10);
        template.damage = new NumberRange(4, 16);
        template.requirements[CombatAttribute.Strength] = 24;
        template.maxDurability = 22;
        break;
      case OneHandedMeleeWeapon.ButterKnife:
        template.levelRange = new NumberRange(0, 0);
        template.damage = new NumberRange(1, 2);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Slashing;
        break;
      case OneHandedMeleeWeapon.ShortSword:
        template.levelRange = new NumberRange(2, 4);
        template.damage = new NumberRange(2, 6);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Slashing;
        template.requirements[CombatAttribute.Strength] = 5;
        template.maxDurability = 9;
        break;
      case OneHandedMeleeWeapon.Blade:
        template.levelRange = new NumberRange(3, 5);
        template.damage = new NumberRange(4, 8);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Slashing;
        template.requirements[CombatAttribute.Strength] = 7;
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.maxDurability = 11;
        break;
      case OneHandedMeleeWeapon.BroadSword:
        template.levelRange = new NumberRange(6, 8);
        template.damage = new NumberRange(4, 12);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Slashing;
        template.requirements[CombatAttribute.Strength] = 17;
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.maxDurability = 15;
        break;
      case OneHandedMeleeWeapon.BastardSword:
        template.levelRange = new NumberRange(8, 10);
        template.damage = new NumberRange(6, 15);
        template.numDamageClassifications = 2;
        mainDamageClassification = null;
        template.possibleDamageClassifications = [
          new HpChangeSource(
            HpChangeSourceCategory.Physical,
            MeleeOrRanged.Melee,
            KineticDamageType.Slashing
          ),
          new HpChangeSource(
            HpChangeSourceCategory.Physical,
            MeleeOrRanged.Melee,
            KineticDamageType.Piercing
          ),
        ];
        template.requirements[CombatAttribute.Strength] = 27;
        template.requirements[CombatAttribute.Dexterity] = 15;
        template.maxDurability = 19;
        break;
      case OneHandedMeleeWeapon.Dagger:
        template.levelRange = new NumberRange(1, 3);
        template.damage = new NumberRange(1, 4);
        mainDamageClassification = null;
        template.numDamageClassifications = 2;
        template.possibleDamageClassifications = [
          new HpChangeSource(
            HpChangeSourceCategory.Physical,
            MeleeOrRanged.Melee,
            KineticDamageType.Slashing
          ),
          new HpChangeSource(
            HpChangeSourceCategory.Physical,
            MeleeOrRanged.Melee,
            KineticDamageType.Piercing
          ),
        ];
        template.maxDurability = 7;
        break;
      case OneHandedMeleeWeapon.Rapier:
        template.levelRange = new NumberRange(3, 6);
        template.damage = new NumberRange(1, 11);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Piercing;
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.maxDurability = 10;
        break;
      case OneHandedMeleeWeapon.ShortSpear:
        template.levelRange = new NumberRange(6, 9);
        template.damage = new NumberRange(4, 13);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Piercing;
        template.requirements[CombatAttribute.Dexterity] = 14;
        template.requirements[CombatAttribute.Strength] = 7;
        template.maxDurability = 18;
        break;
      case OneHandedMeleeWeapon.RuneSword:
        template.levelRange = new NumberRange(5, 10);
        template.damage = new NumberRange(2, 12);
        template.numDamageClassifications = 2;
        mainDamageClassification = null;
        template.possibleDamageClassifications = template.possibleDamageClassifications =
          iterateNumericEnum(MagicalElement)
            .filter(
              (element) => element !== MagicalElement.Dark && element !== MagicalElement.Light
            )
            .map(
              (element) =>
                new HpChangeSource(
                  HpChangeSourceCategory.Physical,
                  MeleeOrRanged.Melee,
                  KineticDamageType.Slashing,
                  element
                )
            );
        template.requirements[CombatAttribute.Strength] = 18;
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.requirements[CombatAttribute.Intelligence] = 3;
        template.maxDurability = 14;
        break;
      case OneHandedMeleeWeapon.EtherBlade:
        template.levelRange = new NumberRange(5, 8);
        template.damage = new NumberRange(6, 10);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Slashing;
        mainDamageClassification.category = HpChangeSourceCategory.Magical;
        template.requirements[CombatAttribute.Intelligence] = 5;
        template.requirements[CombatAttribute.Strength] = 13;
        template.maxDurability = 5;
        break;
      case OneHandedMeleeWeapon.IceBlade:
        template.levelRange = new NumberRange(2, 4);
        template.damage = new NumberRange(2, 6);
        mainDamageClassification.kineticDamageTypeOption = KineticDamageType.Slashing;
        mainDamageClassification.elementOption = MagicalElement.Ice;
        template.requirements[CombatAttribute.Strength] = 8;
        template.requirements[CombatAttribute.Intelligence] = 2;
        template.maxDurability = 5;
        break;
      case OneHandedMeleeWeapon.MapleWand:
        template.levelRange = new NumberRange(2, 4);
        template.damage = new NumberRange(1, 8);
        mainDamageClassification.kineticDamageTypeOption = undefined;
        mainDamageClassification.category = HpChangeSourceCategory.Magical;
        mainDamageClassification.meleeOrRanged = MeleeOrRanged.Ranged;
        template.requirements[CombatAttribute.Intelligence] = 2;
        template.maxDurability = 7;
        break;
      case OneHandedMeleeWeapon.WillowWand:
        template.levelRange = new NumberRange(3, 6);
        template.damage = new NumberRange(2, 10);
        mainDamageClassification.kineticDamageTypeOption = undefined;
        mainDamageClassification.category = HpChangeSourceCategory.Magical;
        mainDamageClassification.meleeOrRanged = MeleeOrRanged.Ranged;
        template.requirements[CombatAttribute.Intelligence] = 10;
        template.maxDurability = 9;
        break;
      case OneHandedMeleeWeapon.YewWand:
        template.levelRange = new NumberRange(5, 7);
        template.damage = new NumberRange(3, 13);
        mainDamageClassification.kineticDamageTypeOption = undefined;
        mainDamageClassification.category = HpChangeSourceCategory.Magical;
        mainDamageClassification.meleeOrRanged = MeleeOrRanged.Ranged;
        template.requirements[CombatAttribute.Intelligence] = 15;
        template.maxDurability = 12;
        break;
      case OneHandedMeleeWeapon.RoseWand:
        template.levelRange = new NumberRange(8, 10);
        template.damage = new NumberRange(6, 16);
        mainDamageClassification.kineticDamageTypeOption = undefined;
        mainDamageClassification.category = HpChangeSourceCategory.Magical;
        mainDamageClassification.meleeOrRanged = MeleeOrRanged.Ranged;
        template.requirements[CombatAttribute.Intelligence] = 20;
        template.maxDurability = 18;
        break;
    }

    if (mainDamageClassification !== null)
      template.possibleDamageClassifications = [mainDamageClassification];

    toReturn[weapon] = template;
  }

  return toReturn as Record<OneHandedMeleeWeapon, OneHandedMeleeWeaponGenerationTemplate>;
})();
