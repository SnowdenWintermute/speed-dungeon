// GENERATED FILE — do not edit by hand.
// Source: the caster-dual-ranged study in packages/balance-tools
// Regenerate: run that study and press "generate equipment requirements"
import {
  CombatAttribute,
  EquipmentType,
  OneHandedMeleeWeapon,
  TwoHandedMeleeWeapon,
} from "./game-data-dependencies.js";
import type { EquipmentRequirementEntry } from "./game-data-dependencies.js";

export const EQUIPMENT_REQUIREMENTS_FROM_CASTER_DUAL_RANGED: EquipmentRequirementEntry[] = [
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Club,
    },
    requirements: { [CombatAttribute.Strength]: 6 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Mace,
    },
    requirements: { [CombatAttribute.Strength]: 14 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Morningstar,
    },
    requirements: { [CombatAttribute.Strength]: 27 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.WarHammer,
    },
    requirements: { [CombatAttribute.Strength]: 53 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.ShortSword,
    },
    requirements: { [CombatAttribute.Strength]: 11, [CombatAttribute.Dexterity]: 6 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Blade,
    },
    requirements: { [CombatAttribute.Strength]: 17, [CombatAttribute.Dexterity]: 11 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.BroadSword,
    },
    requirements: { [CombatAttribute.Strength]: 33, [CombatAttribute.Dexterity]: 20 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.BastardSword,
    },
    requirements: { [CombatAttribute.Strength]: 45, [CombatAttribute.Dexterity]: 26 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Dagger,
    },
    requirements: { [CombatAttribute.Strength]: 7, [CombatAttribute.Dexterity]: 4 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Rapier,
    },
    requirements: { [CombatAttribute.Strength]: 19, [CombatAttribute.Dexterity]: 12 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.ShortSpear,
    },
    requirements: { [CombatAttribute.Strength]: 35, [CombatAttribute.Dexterity]: 22 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.Spear,
    },
    requirements: { [CombatAttribute.Dexterity]: 16 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.SplittingMaul,
    },
    requirements: { [CombatAttribute.Strength]: 22, [CombatAttribute.Dexterity]: 14 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.BattleAxe,
    },
    requirements: { [CombatAttribute.Strength]: 33, [CombatAttribute.Dexterity]: 20 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.Glaive,
    },
    requirements: { [CombatAttribute.Strength]: 38, [CombatAttribute.Dexterity]: 23 },
  },
];
