import {
  ArmorCategory,
  CombatAttribute,
  EquipmentBaseItem,
  EquipmentType,
  NumberRange,
  PrefixType,
  SuffixType,
  BodyArmor,
  iterateNumericEnum,
} from "@speed-dungeon/common";
import { ArmorGenerationTemplate } from "./equipment-generation-template-abstract-classes";

export class BodyArmorGenerationTemplate extends ArmorGenerationTemplate {
  constructor(
    public acRange: NumberRange,
    public armorCategory: ArmorCategory,
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    if (equipmentBaseItem.equipmentType !== EquipmentType.BodyArmor)
      throw new Error("invalid base item provided");

    super(acRange, armorCategory, equipmentBaseItem);
    for (const prefix of iterateNumericEnum(PrefixType)) {
      switch (prefix) {
        case PrefixType.Accuracy:
        case PrefixType.PercentDamage:
        case PrefixType.LifeSteal:
        case PrefixType.ArmorPenetration:
          break;
        case PrefixType.Mp:
        case PrefixType.Evasion:
        case PrefixType.Agility:
        case PrefixType.Focus:
          this.possibleAffixes.prefix[prefix] = 3;
          break;
        case PrefixType.ArmorClass:
        case PrefixType.Resilience:
          this.possibleAffixes.prefix[prefix] = 5;
      }
    }
    for (const suffix of iterateNumericEnum(SuffixType)) {
      switch (suffix) {
        case SuffixType.Damage:
          break;
        case SuffixType.AllBase:
          this.possibleAffixes.suffix[suffix] = 4;
          break;
        case SuffixType.Intelligence:
        case SuffixType.Dexterity:
          this.possibleAffixes.suffix[suffix] = 3;
          break;
        case SuffixType.Hp:
        case SuffixType.Strength:
        case SuffixType.Vitality:
        case SuffixType.Durability:
          this.possibleAffixes.suffix[suffix] = 5;
      }
    }
  }
}

export const BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES: Record<
  BodyArmor,
  BodyArmorGenerationTemplate
> = (() => {
  const toReturn: Partial<Record<BodyArmor, BodyArmorGenerationTemplate>> = {};

  for (const baseItem of iterateNumericEnum(BodyArmor)) {
    let template = new BodyArmorGenerationTemplate(new NumberRange(1, 3), ArmorCategory.Cloth, {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: baseItem,
    });

    switch (baseItem) {
      case BodyArmor.Rags:
        template.levelRange = new NumberRange(1, 3);
        template.acRange = new NumberRange(2, 6);
        break;
      case BodyArmor.Cape:
        template.levelRange = new NumberRange(1, 4);
        template.acRange = new NumberRange(5, 10);
        break;
      case BodyArmor.Cloak:
        template.levelRange = new NumberRange(3, 7);
        template.acRange = new NumberRange(10, 14);
        template.requirements[CombatAttribute.Intelligence] = 5;
        break;
      case BodyArmor.Robe:
        template.levelRange = new NumberRange(6, 9);
        template.acRange = new NumberRange(18, 22);
        template.requirements[CombatAttribute.Intelligence] = 9;
        break;
      case BodyArmor.Kevlar:
        template.levelRange = new NumberRange(8, 10);
        template.acRange = new NumberRange(30, 40);
        template.requirements[CombatAttribute.Intelligence] = 19;
        break;
      case BodyArmor.LeatherArmor:
        template.armorCategory = ArmorCategory.Leather;
        template.levelRange = new NumberRange(1, 5);
        template.acRange = new NumberRange(15, 22);
        template.requirements[CombatAttribute.Dexterity] = 3;
        break;
      case BodyArmor.HardLeatherArmor:
        template.armorCategory = ArmorCategory.Leather;
        template.levelRange = new NumberRange(3, 7);
        template.acRange = new NumberRange(25, 35);
        template.requirements[CombatAttribute.Dexterity] = 7;
        break;
      case BodyArmor.StuddedLeatherArmor:
        template.armorCategory = ArmorCategory.Leather;
        template.levelRange = new NumberRange(5, 8);
        template.acRange = new NumberRange(30, 45);
        template.requirements[CombatAttribute.Dexterity] = 11;
        break;
      case BodyArmor.DemonsaurArmor:
        template.armorCategory = ArmorCategory.Leather;
        template.levelRange = new NumberRange(8, 10);
        template.acRange = new NumberRange(55, 65);
        template.requirements[CombatAttribute.Dexterity] = 19;
        break;
      case BodyArmor.RingMail:
        template.armorCategory = ArmorCategory.Mail;
        template.levelRange = new NumberRange(3, 5);
        template.acRange = new NumberRange(20, 24);
        template.requirements[CombatAttribute.Dexterity] = 3;
        template.requirements[CombatAttribute.Strength] = 3;
        break;
      case BodyArmor.ChainMail:
        template.armorCategory = ArmorCategory.Mail;
        template.levelRange = new NumberRange(4, 6);
        template.acRange = new NumberRange(28, 36);
        template.requirements[CombatAttribute.Dexterity] = 5;
        template.requirements[CombatAttribute.Strength] = 5;
        template.requirements[CombatAttribute.Intelligence] = 3;
        break;
      case BodyArmor.ScaleMail:
        template.armorCategory = ArmorCategory.Mail;
        template.levelRange = new NumberRange(5, 7);
        template.acRange = new NumberRange(34, 45);
        template.requirements[CombatAttribute.Dexterity] = 9;
        template.requirements[CombatAttribute.Intelligence] = 7;
        break;
      case BodyArmor.SplintMail:
        template.armorCategory = ArmorCategory.Mail;
        template.levelRange = new NumberRange(5, 9);
        template.acRange = new NumberRange(48, 60);
        template.requirements[CombatAttribute.Dexterity] = 13;
        template.requirements[CombatAttribute.Strength] = 13;
        break;
      case BodyArmor.OhmushellMail:
        template.armorCategory = ArmorCategory.Mail;
        template.levelRange = new NumberRange(8, 10);
        template.acRange = new NumberRange(65, 80);
        template.requirements[CombatAttribute.Dexterity] = 15;
        template.requirements[CombatAttribute.Strength] = 15;
        template.requirements[CombatAttribute.Intelligence] = 7;
        break;
      case BodyArmor.BreastPlate:
        template.armorCategory = ArmorCategory.Plate;
        template.levelRange = new NumberRange(2, 4);
        template.acRange = new NumberRange(30, 38);
        template.requirements[CombatAttribute.Strength] = 9;
        break;
      case BodyArmor.FieldPlate:
        template.armorCategory = ArmorCategory.Plate;
        template.levelRange = new NumberRange(4, 6);
        template.acRange = new NumberRange(40, 45);
        template.requirements[CombatAttribute.Strength] = 15;
        break;
      case BodyArmor.GothicPlate:
        template.armorCategory = ArmorCategory.Plate;
        template.levelRange = new NumberRange(5, 8);
        template.acRange = new NumberRange(50, 60);
        template.requirements[CombatAttribute.Strength] = 19;
        break;
      case BodyArmor.FullPlate:
        template.armorCategory = ArmorCategory.Plate;
        template.levelRange = new NumberRange(8, 9);
        template.acRange = new NumberRange(60, 75);
        template.requirements[CombatAttribute.Strength] = 25;
        break;
      case BodyArmor.ShardPlate:
        template.armorCategory = ArmorCategory.Plate;
        template.levelRange = new NumberRange(10, 10);
        template.acRange = new NumberRange(80, 100);
        template.requirements[CombatAttribute.Strength] = 35;
        break;
    }

    switch (template.armorCategory) {
      case ArmorCategory.Cloth:
        template.possibleAffixes.prefix[PrefixType.Mp] = 5;
        template.possibleAffixes.prefix[PrefixType.Focus] = 5;
        template.possibleAffixes.suffix[SuffixType.Intelligence] = 5;
        break;
      case ArmorCategory.Leather:
        template.possibleAffixes.prefix[PrefixType.Agility] = 5;
        template.possibleAffixes.prefix[PrefixType.Evasion] = 5;
        template.possibleAffixes.suffix[SuffixType.Dexterity] = 5;
        break;
      case ArmorCategory.Mail:
        template.possibleAffixes.prefix[PrefixType.Mp] = 5;
        template.possibleAffixes.prefix[PrefixType.Focus] = 5;
        template.possibleAffixes.suffix[SuffixType.Intelligence] = 5;
        template.possibleAffixes.prefix[PrefixType.Agility] = 5;
        template.possibleAffixes.prefix[PrefixType.Evasion] = 5;
        template.possibleAffixes.suffix[SuffixType.Dexterity] = 5;
        break;
      case ArmorCategory.Plate:
        delete template.possibleAffixes.prefix[PrefixType.Agility];
        delete template.possibleAffixes.prefix[PrefixType.Evasion];
        break;
    }

    toReturn[baseItem] = template;
  }

  return toReturn as Record<BodyArmor, BodyArmorGenerationTemplate>;
})();
