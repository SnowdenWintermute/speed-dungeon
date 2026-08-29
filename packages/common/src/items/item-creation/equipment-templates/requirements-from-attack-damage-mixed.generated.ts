// GENERATED FILE — do not edit by hand.
// Source: the attack-damage-mixed study in packages/balance-tools
// Regenerate: run that study and press "generate equipment requirements"
import {
  BodyArmor,
  CombatAttribute,
  EquipmentType,
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
];
