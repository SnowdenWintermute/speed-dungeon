import {
  Amulet,
  EQUIPMENT_TYPE_STRINGS,
  EquipmentBaseItem,
  EquipmentType,
  Jewelry,
  Ring,
} from "@speed-dungeon/common";
import { ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES } from "./one-handed-melee-weapon-templates.js";
import { SHIELD_EQUIPMENT_GENERATION_TEMPLATES } from "./shield-templates.js";
import { TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES } from "./two-handed-melee-weapon-templates.js";
import { TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES } from "./two-handed-ranged-weapon-templates.js";
import { BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES } from "./body-armor-generation-templates.js";
import { HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES } from "./head-gear-generation-templates.js";
import { JewelryGenerationTemplate } from "./jewelry-generation-templates.js";
import { EquipmentGenerationTemplate } from "./equipment-generation-template-abstract-classes.js";

export function getEquipmentGenerationTemplate(
  equipmentBaseItem: EquipmentBaseItem
): EquipmentGenerationTemplate {
  console.log(
    "base item to gen: ",
    equipmentBaseItem.equipmentType,
    EQUIPMENT_TYPE_STRINGS[equipmentBaseItem.equipmentType]
  );
  switch (equipmentBaseItem.equipmentType) {
    case EquipmentType.BodyArmor:
      return BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES[equipmentBaseItem.baseItemType];
    case EquipmentType.HeadGear:
      return HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES[equipmentBaseItem.baseItemType];
    case EquipmentType.Ring:
      return new JewelryGenerationTemplate({
        equipmentType: EquipmentType.Ring,
        baseItemType: Ring.Ring,
      });
    case EquipmentType.Amulet:
      return new JewelryGenerationTemplate({
        equipmentType: EquipmentType.Amulet,
        baseItemType: Amulet.Amulet,
      });
    case EquipmentType.OneHandedMeleeWeapon:
      return ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES[equipmentBaseItem.baseItemType];
    case EquipmentType.TwoHandedMeleeWeapon:
      return TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES[equipmentBaseItem.baseItemType];
    case EquipmentType.TwoHandedRangedWeapon:
      return TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES[equipmentBaseItem.baseItemType];
    case EquipmentType.Shield:
      return SHIELD_EQUIPMENT_GENERATION_TEMPLATES[equipmentBaseItem.baseItemType];
  }
}
