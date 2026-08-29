// GENERATED FILE — do not edit by hand.
// Source: the attack-damage-mixed study in packages/balance-tools
// Regenerate: run that study and press "generate equipment requirements"
import {
  BodyArmor,
  CombatAttribute,
  EquipmentType,
  HeadGear,
} from "./game-data-dependencies.js";
import type { EquipmentRequirementEntry } from "./game-data-dependencies.js";

export const EQUIPMENT_REQUIREMENTS_FROM_ATTACK_DAMAGE_MIXED: EquipmentRequirementEntry[] = [
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.LeatherVest,
    },
    requirements: { [CombatAttribute.Dexterity]: 23 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.HardLeather,
    },
    requirements: { [CombatAttribute.Strength]: 20, [CombatAttribute.Dexterity]: 21 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.StuddedLeather,
    },
    requirements: { [CombatAttribute.Dexterity]: 41 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.DemonsaurLeather,
    },
    requirements: { [CombatAttribute.Dexterity]: 58 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Eyepatch,
    },
    requirements: { [CombatAttribute.Dexterity]: 9 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.LeatherHat,
    },
    requirements: { [CombatAttribute.Dexterity]: 22 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.LeatherHelm,
    },
    requirements: { [CombatAttribute.Dexterity]: 33 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.DemonsaurHelm,
    },
    requirements: { [CombatAttribute.Dexterity]: 58 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.BreastPlate,
    },
    requirements: { [CombatAttribute.Strength]: 14 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.FieldPlate,
    },
    requirements: { [CombatAttribute.Strength]: 27 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.GothicPlate,
    },
    requirements: { [CombatAttribute.Strength]: 42 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.FullPlate,
    },
    requirements: { [CombatAttribute.Strength]: 59 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Circlet,
    },
    requirements: { [CombatAttribute.Strength]: 9 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Crown,
    },
    requirements: { [CombatAttribute.Strength]: 27 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.FullHelm,
    },
    requirements: { [CombatAttribute.Strength]: 44 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.GreatHelm,
    },
    requirements: { [CombatAttribute.Strength]: 60 },
  },
];
