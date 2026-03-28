import { JewelryGenerationTemplate } from "./jewelry.js";
import { BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES } from "./body-armor.js";
import { HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES } from "./head-gear.js";
import { EquipmentGenerationTemplate } from "./base-templates.js";
import { ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES } from "./one-handed-melee-weapons.js";
import { TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES } from "./two-handed-melee-weapons.js";
import { TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES } from "./two-handed-ranged-weapons.js";
import { SHIELD_EQUIPMENT_GENERATION_TEMPLATES } from "./shields.js";
import { EquipmentBaseItem, EquipmentType } from "../../equipment/equipment-types/index.js";
import { Amulet, Ring } from "../../equipment/equipment-types/jewelry.js";

export function getEquipmentGenerationTemplate(
  equipmentBaseItem: EquipmentBaseItem
): EquipmentGenerationTemplate {
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
