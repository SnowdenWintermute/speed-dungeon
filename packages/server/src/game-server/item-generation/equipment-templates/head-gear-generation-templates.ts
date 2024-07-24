import {
  ArmorCategory,
  CombatAttribute,
  EquipmentBaseItem,
  EquipmentType,
  NumberRange,
  HeadGear,
  iterateNumericEnum,
  SuffixType,
} from "@speed-dungeon/common";
import { ArmorGenerationTemplate } from "./equipment-generation-template-abstract-classes";
import { modifyPossibleAffixesByArmorCategory } from "./armor-category-affixes";

export class HeadGearGenerationTemplate extends ArmorGenerationTemplate {
  constructor(
    public acRange: NumberRange,
    public armorCategory: ArmorCategory,
    public equipmentBaseItem: EquipmentBaseItem
  ) {
    if (equipmentBaseItem.equipmentType !== EquipmentType.HeadGear)
      throw new Error("invalid base item provided");

    super(acRange, armorCategory, equipmentBaseItem);
  }
}

export const HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES: Record<
  HeadGear,
  HeadGearGenerationTemplate
> = (() => {
  const toReturn: Partial<Record<HeadGear, HeadGearGenerationTemplate>> = {};

  for (const baseItem of iterateNumericEnum(HeadGear)) {
    let armorCategory = ArmorCategory.Cloth;
    switch (baseItem) {
      case HeadGear.Cap:
      case HeadGear.Bandana:
      case HeadGear.PaddedCap:
      case HeadGear.Ribbon:
      case HeadGear.WizardHat:
        armorCategory = ArmorCategory.Cloth;
        break;
      case HeadGear.Eyepatch:
      case HeadGear.LeatherHat:
      case HeadGear.LeatherHelm:
      case HeadGear.DemonsaurHelm:
        armorCategory = ArmorCategory.Leather;
        break;
      case HeadGear.Hairpin:
      case HeadGear.Skullcap:
      case HeadGear.Coif:
      case HeadGear.OhmushellMask:
        armorCategory = ArmorCategory.Mail;
        break;
      case HeadGear.Circlet:
      case HeadGear.Crown:
      case HeadGear.FullHelm:
      case HeadGear.GreatHelm:
        armorCategory = ArmorCategory.Plate;
    }

    let template = new HeadGearGenerationTemplate(new NumberRange(1, 3), armorCategory, {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: baseItem,
    });

    modifyPossibleAffixesByArmorCategory(
      template.possibleAffixes,
      EquipmentType.HeadGear,
      template.armorCategory
    );

    switch (baseItem) {
      case HeadGear.Cap:
        template.levelRange = new NumberRange(1, 3);
        template.acRange = new NumberRange(1, 3);
        break;
      case HeadGear.Bandana:
        template.levelRange = new NumberRange(2, 4);
        template.acRange = new NumberRange(2, 4);
        template.requirements[CombatAttribute.Intelligence] = 3;
        break;
      case HeadGear.PaddedCap:
        template.levelRange = new NumberRange(3, 6);
        template.acRange = new NumberRange(3, 6);
        template.requirements[CombatAttribute.Intelligence] = 7;
        break;
      case HeadGear.Ribbon:
        template.levelRange = new NumberRange(5, 10);
        template.acRange = new NumberRange(1, 1);
        delete template.possibleAffixes.suffix[SuffixType.Strength];
        delete template.possibleAffixes.suffix[SuffixType.Dexterity];
        delete template.possibleAffixes.suffix[SuffixType.Vitality];
        delete template.possibleAffixes.suffix[SuffixType.Intelligence];
        template.possibleAffixes.suffix[SuffixType.AllBase] = 5;
        break;
      case HeadGear.WizardHat:
        template.levelRange = new NumberRange(7, 10);
        template.acRange = new NumberRange(6, 14);
        template.requirements[CombatAttribute.Intelligence] = 19;
        break;
      case HeadGear.Eyepatch:
        template.levelRange = new NumberRange(1, 3);
        template.acRange = new NumberRange(2, 5);
        template.requirements[CombatAttribute.Dexterity] = 2;
        break;
      case HeadGear.LeatherHat:
        template.levelRange = new NumberRange(2, 5);
        template.acRange = new NumberRange(5, 8);
        template.requirements[CombatAttribute.Dexterity] = 5;
        break;
      case HeadGear.LeatherHelm:
        template.levelRange = new NumberRange(4, 8);
        template.acRange = new NumberRange(9, 15);
        template.requirements[CombatAttribute.Dexterity] = 7;
        break;
      case HeadGear.DemonsaurHelm:
        template.levelRange = new NumberRange(9, 10);
        template.acRange = new NumberRange(18, 24);
        template.requirements[CombatAttribute.Dexterity] = 19;
        break;
      case HeadGear.Hairpin:
        template.levelRange = new NumberRange(3, 4);
        template.acRange = new NumberRange(2, 2);
        template.possibleAffixes.suffix[SuffixType.AllBase] = 5;
        break;
      case HeadGear.Skullcap:
        template.levelRange = new NumberRange(3, 6);
        template.acRange = new NumberRange(8, 16);
        template.requirements[CombatAttribute.Strength] = 7;
        template.requirements[CombatAttribute.Dexterity] = 7;
        break;
      case HeadGear.Coif:
        template.levelRange = new NumberRange(4, 8);
        template.acRange = new NumberRange(20, 26);
        template.requirements[CombatAttribute.Strength] = 9;
        template.requirements[CombatAttribute.Dexterity] = 9;
        template.requirements[CombatAttribute.Intelligence] = 5;
        break;
      case HeadGear.OhmushellMask:
        template.levelRange = new NumberRange(7, 10);
        template.acRange = new NumberRange(30, 38);
        template.requirements[CombatAttribute.Strength] = 15;
        template.requirements[CombatAttribute.Dexterity] = 15;
        template.requirements[CombatAttribute.Intelligence] = 9;
        break;
      case HeadGear.Circlet:
        template.levelRange = new NumberRange(2, 5);
        template.acRange = new NumberRange(5, 10);
        break;
      case HeadGear.Crown:
        template.levelRange = new NumberRange(3, 7);
        template.acRange = new NumberRange(10, 20);
        template.requirements[CombatAttribute.Strength] = 7;
        break;
      case HeadGear.FullHelm:
        template.levelRange = new NumberRange(6, 9);
        template.acRange = new NumberRange(22, 30);
        template.requirements[CombatAttribute.Strength] = 11;
        break;
      case HeadGear.GreatHelm:
        template.levelRange = new NumberRange(9, 10);
        template.acRange = new NumberRange(32, 40);
        template.requirements[CombatAttribute.Strength] = 19;
        break;
    }

    toReturn[baseItem] = template;
  }

  return toReturn as Record<HeadGear, HeadGearGenerationTemplate>;
})();
