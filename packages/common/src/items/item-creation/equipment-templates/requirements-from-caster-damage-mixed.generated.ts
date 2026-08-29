// GENERATED FILE — do not edit by hand.
// Source: the caster-damage-mixed study in packages/balance-tools
// Regenerate: run that study and press "generate equipment requirements"
import {
  BodyArmor,
  CombatAttribute,
  EquipmentType,
  HeadGear,
} from "./game-data-dependencies.js";
import type { EquipmentRequirementEntry } from "./game-data-dependencies.js";

export const EQUIPMENT_REQUIREMENTS_FROM_CASTER_DAMAGE_MIXED: EquipmentRequirementEntry[] = [
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.Cloak,
    },
    requirements: { [CombatAttribute.Spirit]: 9 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.Robe,
    },
    requirements: { [CombatAttribute.Spirit]: 18 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.OfficersRobe,
    },
    requirements: { [CombatAttribute.Spirit]: 37 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.MageRobe,
    },
    requirements: { [CombatAttribute.Spirit]: 50 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Bandana,
    },
    requirements: { [CombatAttribute.Spirit]: 9 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.PaddedCap,
    },
    requirements: { [CombatAttribute.Spirit]: 16 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Ribbon,
    },
    requirements: { [CombatAttribute.Spirit]: 32 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.WizardHat,
    },
    requirements: { [CombatAttribute.Spirit]: 49 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.RingMail,
    },
    requirements: { [CombatAttribute.Spirit]: 12 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.SplintMail,
    },
    requirements: { [CombatAttribute.Spirit]: 22 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.FeatherMail,
    },
    requirements: { [CombatAttribute.Spirit]: 37 },
  },
];
