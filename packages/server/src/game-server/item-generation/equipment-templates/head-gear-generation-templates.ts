import {
  ArmorCategory,
  CombatAttribute,
  EquipmentBaseItem,
  EquipmentType,
  NumberRange,
  HeadGear,
  iterateNumericEnum,
  AffixType,
} from "@speed-dungeon/common";
import { ArmorGenerationTemplate } from "./equipment-generation-template-abstract-classes.js";
import { modifyPossibleAffixesByArmorCategory } from "./armor-category-affixes.js";

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
        template.maxDurability = 6;
        break;
      case HeadGear.Bandana:
        template.levelRange = new NumberRange(2, 4);
        template.acRange = new NumberRange(2, 4);
        template.requirements[CombatAttribute.Spirit] = 3;
        template.maxDurability = 5;
        break;
      case HeadGear.PaddedCap:
        template.levelRange = new NumberRange(3, 6);
        template.acRange = new NumberRange(3, 6);
        template.requirements[CombatAttribute.Spirit] = 7;
        template.maxDurability = 7;
        break;
      case HeadGear.Ribbon:
        template.levelRange = new NumberRange(5, 10);
        template.acRange = new NumberRange(1, 1);
        delete template.possibleAffixes.suffix[AffixType.Strength];
        delete template.possibleAffixes.suffix[AffixType.Dexterity];
        delete template.possibleAffixes.suffix[AffixType.Vitality];
        delete template.possibleAffixes.suffix[AffixType.Spirit];
        // template.possibleAffixes.suffix[AffixType.AllBase] = 5;
        template.maxDurability = 7;
        break;
      case HeadGear.WizardHat:
        template.levelRange = new NumberRange(7, 10);
        template.acRange = new NumberRange(6, 14);
        template.requirements[CombatAttribute.Spirit] = 19;
        template.maxDurability = 16;
        break;
      case HeadGear.Eyepatch:
        template.levelRange = new NumberRange(1, 3);
        template.acRange = new NumberRange(2, 5);
        template.requirements[CombatAttribute.Dexterity] = 2;
        template.maxDurability = 8;
        break;
      case HeadGear.LeatherHat:
        template.levelRange = new NumberRange(3, 5);
        template.acRange = new NumberRange(5, 8);
        template.requirements[CombatAttribute.Dexterity] = 5;
        template.maxDurability = 10;
        break;
      case HeadGear.LeatherHelm:
        template.levelRange = new NumberRange(4, 8);
        template.acRange = new NumberRange(9, 15);
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.maxDurability = 13;
        break;
      case HeadGear.DemonsaurHelm:
        template.levelRange = new NumberRange(9, 10);
        template.acRange = new NumberRange(18, 24);
        template.requirements[CombatAttribute.Dexterity] = 19;
        template.maxDurability = 42;
        break;
      case HeadGear.Hairpin:
        template.levelRange = new NumberRange(3, 4);
        template.acRange = new NumberRange(2, 2);
        // template.possibleAffixes.suffix[AffixType.AllBase] = 5;
        template.maxDurability = 10;
        break;
      case HeadGear.Skullcap:
        template.levelRange = new NumberRange(4, 5);
        template.acRange = new NumberRange(8, 16);
        template.requirements[CombatAttribute.Strength] = 7;
        template.requirements[CombatAttribute.Dexterity] = 7;
        template.maxDurability = 14;
        break;
      case HeadGear.Coif:
        template.levelRange = new NumberRange(5, 8);
        template.acRange = new NumberRange(20, 26);
        template.requirements[CombatAttribute.Strength] = 9;
        template.requirements[CombatAttribute.Dexterity] = 9;
        template.requirements[CombatAttribute.Spirit] = 5;
        template.maxDurability = 19;
        break;
      case HeadGear.OhmushellMask:
        template.levelRange = new NumberRange(7, 10);
        template.acRange = new NumberRange(30, 38);
        template.requirements[CombatAttribute.Strength] = 15;
        template.requirements[CombatAttribute.Dexterity] = 15;
        template.requirements[CombatAttribute.Spirit] = 9;
        template.maxDurability = 50;
        break;
      case HeadGear.Circlet:
        template.levelRange = new NumberRange(2, 4);
        template.acRange = new NumberRange(5, 10);
        template.maxDurability = 12;
        break;
      case HeadGear.Crown:
        template.levelRange = new NumberRange(4, 6);
        template.acRange = new NumberRange(10, 20);
        template.requirements[CombatAttribute.Strength] = 7;
        template.maxDurability = 18;
        break;
      case HeadGear.FullHelm:
        template.levelRange = new NumberRange(6, 9);
        template.acRange = new NumberRange(22, 30);
        template.requirements[CombatAttribute.Strength] = 11;
        template.maxDurability = 48;
        break;
      case HeadGear.GreatHelm:
        template.levelRange = new NumberRange(9, 10);
        template.acRange = new NumberRange(32, 40);
        template.requirements[CombatAttribute.Strength] = 19;
        template.maxDurability = 70;
        break;
    }

    toReturn[baseItem] = template;
  }

  return toReturn as Record<HeadGear, HeadGearGenerationTemplate>;
})();
