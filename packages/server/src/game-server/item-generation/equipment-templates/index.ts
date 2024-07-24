import { EquipmentBaseItem, EquipmentType } from "@speed-dungeon/common";
import { ONE_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES } from "./one-handed-melee-weapon-templates";
import { SHIELD_EQUIPMENT_GENERATION_TEMPLATES } from "./shield-templates";
import { TWO_HANDED_MELEE_EQUIPMENT_GENERATION_TEMPLATES } from "./two-handed-melee-weapon-templates";
import { TWO_HANDED_RANGED_EQUIPMENT_GENERATION_TEMPLATES } from "./two-handed-ranged-weapon-templates";
import { BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES } from "./body-armor-generation-templates";
import { HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES } from "./head-gear-generation-templates";

export function getEquipmentGenerationTemplate(equipmentBaseItem: EquipmentBaseItem) {
  switch (equipmentBaseItem.equipmentType) {
    case EquipmentType.BodyArmor:
      return BODY_ARMOR_EQUIPMENT_GENERATION_TEMPLATES[equipmentBaseItem.baseItemType];
    case EquipmentType.HeadGear:
      return HEAD_GEAR_EQUIPMENT_GENERATION_TEMPLATES[equipmentBaseItem.baseItemType];
    case EquipmentType.Ring:
      break;
    case EquipmentType.Amulet:
      break;
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
