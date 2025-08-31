import {
  ArmorCategory,
  CombatAttribute,
  EquipmentBaseItem,
  EquipmentType,
  NumberRange,
  BodyArmor,
  iterateNumericEnum,
  PREFIX_TYPES,
  SUFFIX_TYPES,
  AffixType,
} from "@speed-dungeon/common";
import { ArmorGenerationTemplate } from "./equipment-generation-template-abstract-classes.js";
import { modifyPossibleAffixesByArmorCategory } from "./armor-category-affixes.js";

export class BodyArmorGenerationTemplate extends ArmorGenerationTemplate {
  constructor(
    public acRange: NumberRange,
    public armorCategory: ArmorCategory,
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    if (equipmentBaseItem.equipmentType !== EquipmentType.BodyArmor)
      throw new Error("invalid base item provided");

    super(acRange, armorCategory, equipmentBaseItem);
  }
}

export const BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES: Record<
  BodyArmor,
  BodyArmorGenerationTemplate
> = (() => {
  const toReturn: Partial<Record<BodyArmor, BodyArmorGenerationTemplate>> = {};

  for (const baseItem of iterateNumericEnum(BodyArmor)) {
    let armorCategory = ArmorCategory.Cloth;
    switch (baseItem) {
      case BodyArmor.Rags:
      case BodyArmor.Cape:
      case BodyArmor.Cloak:
      case BodyArmor.Robe:
      case BodyArmor.Kevlar:
        armorCategory = ArmorCategory.Cloth;
        break;
      case BodyArmor.LeatherArmor:
      case BodyArmor.HardLeatherArmor:
      case BodyArmor.StuddedLeatherArmor:
      case BodyArmor.DemonsaurArmor:
        armorCategory = ArmorCategory.Leather;
        break;
      case BodyArmor.RingMail:
      case BodyArmor.ChainMail:
      case BodyArmor.ScaleMail:
      case BodyArmor.SplintMail:
      case BodyArmor.OhmushellMail:
        armorCategory = ArmorCategory.Mail;
        break;
      case BodyArmor.BreastPlate:
      case BodyArmor.FieldPlate:
      case BodyArmor.GothicPlate:
      case BodyArmor.FullPlate:
      case BodyArmor.ShardPlate:
        armorCategory = ArmorCategory.Plate;
        break;
    }

    let template = new BodyArmorGenerationTemplate(new NumberRange(1, 3), armorCategory, {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: baseItem,
    });

    // GENERIC ARMOR POSSIBLE AFFIXES
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
          template.possibleAffixes.prefix[prefix] = 3;
          break;
        case AffixType.FlatArmorClass:
          template.possibleAffixes.prefix[prefix] = 5;
      }
    }
    for (const suffix of SUFFIX_TYPES) {
      switch (suffix) {
        case AffixType.FlatDamage:
          break;
        case AffixType.Spirit:
        case AffixType.Dexterity:
          template.possibleAffixes.suffix[suffix] = 3;
          break;
        case AffixType.Hp:
        case AffixType.Strength:
        case AffixType.Vitality:
        case AffixType.Durability:
        case AffixType.PercentArmorClass:
          template.possibleAffixes.suffix[suffix] = 5;
      }
    }

    modifyPossibleAffixesByArmorCategory(
      template.possibleAffixes,
      EquipmentType.BodyArmor,
      template.armorCategory
    );

    switch (baseItem) {
      case BodyArmor.Rags:
        template.levelRange = new NumberRange(1, 3);
        template.acRange = new NumberRange(2, 6);
        template.maxDurability = 6;
        break;
      case BodyArmor.Cape:
        template.levelRange = new NumberRange(2, 4);
        template.acRange = new NumberRange(5, 10);
        template.maxDurability = 10;
        break;
      case BodyArmor.Cloak:
        template.levelRange = new NumberRange(3, 7);
        template.acRange = new NumberRange(10, 14);
        template.requirements[CombatAttribute.Spirit] = 5;
        template.maxDurability = 16;
        break;
      case BodyArmor.Robe:
        template.levelRange = new NumberRange(6, 9);
        template.acRange = new NumberRange(18, 22);
        template.requirements[CombatAttribute.Spirit] = 9;
        template.maxDurability = 20;
        break;
      case BodyArmor.Kevlar:
        template.levelRange = new NumberRange(8, 10);
        template.acRange = new NumberRange(30, 40);
        template.requirements[CombatAttribute.Spirit] = 19;
        template.maxDurability = 40;
        break;
      case BodyArmor.LeatherArmor:
        template.levelRange = new NumberRange(3, 5);
        template.acRange = new NumberRange(15, 22);
        template.requirements[CombatAttribute.Dexterity] = 5;
        template.maxDurability = 12;
        break;
      case BodyArmor.HardLeatherArmor:
        template.levelRange = new NumberRange(5, 7);
        template.acRange = new NumberRange(25, 35);
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.maxDurability = 18;
        break;
      case BodyArmor.StuddedLeatherArmor:
        template.levelRange = new NumberRange(6, 8);
        template.acRange = new NumberRange(30, 45);
        template.requirements[CombatAttribute.Dexterity] = 11;
        template.maxDurability = 24;
        break;
      case BodyArmor.DemonsaurArmor:
        template.levelRange = new NumberRange(8, 10);
        template.acRange = new NumberRange(55, 65);
        template.requirements[CombatAttribute.Dexterity] = 19;
        template.maxDurability = 52;
        break;
      case BodyArmor.RingMail:
        template.levelRange = new NumberRange(3, 5);
        template.acRange = new NumberRange(20, 24);
        template.requirements[CombatAttribute.Dexterity] = 3;
        template.requirements[CombatAttribute.Strength] = 3;
        template.maxDurability = 17;
        break;
      case BodyArmor.ChainMail:
        template.levelRange = new NumberRange(4, 6);
        template.acRange = new NumberRange(28, 36);
        template.requirements[CombatAttribute.Dexterity] = 5;
        template.requirements[CombatAttribute.Strength] = 5;
        template.requirements[CombatAttribute.Spirit] = 3;
        template.maxDurability = 21;
        break;
      case BodyArmor.ScaleMail:
        template.levelRange = new NumberRange(5, 7);
        template.acRange = new NumberRange(34, 45);
        template.requirements[CombatAttribute.Dexterity] = 9;
        template.requirements[CombatAttribute.Spirit] = 7;
        template.maxDurability = 25;
        break;
      case BodyArmor.SplintMail:
        template.levelRange = new NumberRange(5, 9);
        template.acRange = new NumberRange(48, 60);
        template.requirements[CombatAttribute.Dexterity] = 13;
        template.requirements[CombatAttribute.Strength] = 13;
        template.maxDurability = 29;
        break;
      case BodyArmor.OhmushellMail:
        template.levelRange = new NumberRange(8, 10);
        template.acRange = new NumberRange(65, 80);
        template.requirements[CombatAttribute.Dexterity] = 15;
        template.requirements[CombatAttribute.Strength] = 15;
        template.requirements[CombatAttribute.Spirit] = 7;
        template.maxDurability = 70;
        break;
      case BodyArmor.BreastPlate:
        template.levelRange = new NumberRange(2, 4);
        template.acRange = new NumberRange(30, 38);
        template.requirements[CombatAttribute.Strength] = 9;
        template.maxDurability = 20;
        break;
      case BodyArmor.FieldPlate:
        template.levelRange = new NumberRange(4, 6);
        template.acRange = new NumberRange(40, 45);
        template.requirements[CombatAttribute.Strength] = 15;
        template.maxDurability = 28;
        break;
      case BodyArmor.GothicPlate:
        template.levelRange = new NumberRange(5, 8);
        template.acRange = new NumberRange(50, 60);
        template.requirements[CombatAttribute.Strength] = 19;
        template.maxDurability = 44;
        break;
      case BodyArmor.FullPlate:
        template.levelRange = new NumberRange(8, 9);
        template.acRange = new NumberRange(60, 75);
        template.requirements[CombatAttribute.Strength] = 25;
        template.maxDurability = 80;
        break;
      case BodyArmor.ShardPlate:
        template.levelRange = new NumberRange(10, 10);
        template.acRange = new NumberRange(80, 100);
        template.requirements[CombatAttribute.Strength] = 35;
        template.maxDurability = 100;
        break;
    }

    toReturn[baseItem] = template;
  }

  return toReturn as Record<BodyArmor, BodyArmorGenerationTemplate>;
})();
