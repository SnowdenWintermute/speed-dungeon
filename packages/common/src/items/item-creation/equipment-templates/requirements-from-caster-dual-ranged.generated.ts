// GENERATED FILE — do not edit by hand.
// Source: the caster-dual-ranged study in packages/balance-tools
// Regenerate: run that study and press "generate equipment requirements"
import {
  CombatAttribute,
  EquipmentType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
} from "./game-data-dependencies.js";
import type { EquipmentRequirementEntry } from "./game-data-dependencies.js";

export const EQUIPMENT_REQUIREMENTS_FROM_CASTER_DUAL_RANGED: EquipmentRequirementEntry[] = [
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Club,
    },
    requirements: { [CombatAttribute.Strength]: 2 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Mace,
    },
    requirements: { [CombatAttribute.Strength]: 15 },
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
    requirements: { [CombatAttribute.Strength]: 49 },
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
    requirements: { [CombatAttribute.Strength]: 19, [CombatAttribute.Dexterity]: 11 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.BroadSword,
    },
    requirements: { [CombatAttribute.Strength]: 34, [CombatAttribute.Dexterity]: 21 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.BastardSword,
    },
    requirements: { [CombatAttribute.Strength]: 42, [CombatAttribute.Dexterity]: 24 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Dagger,
    },
    requirements: { [CombatAttribute.Strength]: 3, [CombatAttribute.Dexterity]: 1 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Rapier,
    },
    requirements: { [CombatAttribute.Strength]: 21, [CombatAttribute.Dexterity]: 13 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.ShortSpear,
    },
    requirements: { [CombatAttribute.Strength]: 35, [CombatAttribute.Dexterity]: 21 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.Spear,
    },
    requirements: { [CombatAttribute.Dexterity]: 8 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.SplittingMaul,
    },
    requirements: { [CombatAttribute.Strength]: 22, [CombatAttribute.Dexterity]: 13 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.BattleAxe,
    },
    requirements: { [CombatAttribute.Strength]: 30, [CombatAttribute.Dexterity]: 17 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.Glaive,
    },
    requirements: { [CombatAttribute.Strength]: 36, [CombatAttribute.Dexterity]: 21 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.CabinetDoor,
    },
    requirements: { [CombatAttribute.Strength]: 2, [CombatAttribute.Dexterity]: 1 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.Heater,
    },
    requirements: { [CombatAttribute.Strength]: 14, [CombatAttribute.Dexterity]: 8 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.Aspis,
    },
    requirements: { [CombatAttribute.Strength]: 28, [CombatAttribute.Dexterity]: 15 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.KiteShield,
    },
    requirements: { [CombatAttribute.Strength]: 35, [CombatAttribute.Dexterity]: 21 },
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.GothicShield,
    },
    requirements: { [CombatAttribute.Strength]: 50, [CombatAttribute.Dexterity]: 30 },
  },
];
