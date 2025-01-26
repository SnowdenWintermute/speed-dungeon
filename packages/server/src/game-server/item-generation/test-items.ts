import {
  AffixType,
  ArmorCategory,
  BodyArmor,
  CombatAttribute,
  Equipment,
  EquipmentTraitType,
  EquipmentType,
  HpChangeSource,
  HpChangeSourceCategory,
  MaxAndCurrent,
  NumberRange,
  OneHandedMeleeWeapon,
  PrefixType,
  SuffixType,
} from "@speed-dungeon/common";
import { idGenerator } from "../../singletons.js";

// export const HP_ARMOR_TEST_ITEM = new Equipment(
//   { id: idGenerator.generate(), name: "hp armor less" },
//   0,
//   {},
//   {
//     taggedBaseEquipment: {
//       equipmentType: EquipmentType.BodyArmor,
//       baseItemType: BodyArmor.GothicPlate,
//     },
//     equipmentType: EquipmentType.BodyArmor,
//     armorClass: 1,
//     armorCategory: ArmorCategory.Plate,
//   },
//   new MaxAndCurrent(1, 1)
// );
// HP_ARMOR_TEST_ITEM.affixes = {
//   [AffixType.Suffix]: {
//     [SuffixType.Hp]: {
//       combatAttributes: { [CombatAttribute.Hp]: 4 },
//       equipmentTraits: {},
//       tier: 1,
//     },
//   },
//   [AffixType.Prefix]: {
//     [PrefixType.ArmorClass]: {
//       combatAttributes: { [CombatAttribute.ArmorClass]: 4 },
//       equipmentTraits: {},
//       tier: 1,
//     },
//     [PrefixType.Mp]: {
//       combatAttributes: { [CombatAttribute.Mp]: 4 },
//       equipmentTraits: {},
//       tier: 1,
//     },
//   },
// };

// export const WEAPON_TEST_ITEM = new Equipment(
//   { id: idGenerator.generate(), name: "the damager" },
//   0,
//   {},
//   {
//     taggedBaseEquipment: {
//       equipmentType: EquipmentType.OneHandedMeleeWeapon,
//       baseItemType: OneHandedMeleeWeapon.ButterKnife,
//     },
//     equipmentType: EquipmentType.OneHandedMeleeWeapon,
//     damageClassification: [
//       new HpChangeSource(HpChangeSourceCategory.Physical, MeleeOrRanged.Melee),
//     ],
//     damage: new NumberRange(1, 4),
//   },
//   new MaxAndCurrent(1, 1)
// );

// WEAPON_TEST_ITEM.affixes = {
//   [AffixType.Suffix]: {
//     [SuffixType.Damage]: {
//       combatAttributes: {},
//       equipmentTraits: {
//         [EquipmentTraitType.FlatDamageAdditive]: {
//           equipmentTraitType: EquipmentTraitType.FlatDamageAdditive,
//           value: 10,
//         },
//       },
//       tier: 1,
//     },
//   },
//   [AffixType.Prefix]: {
//     [PrefixType.Mp]: {
//       combatAttributes: { [CombatAttribute.Mp]: 4 },
//       equipmentTraits: {},
//       tier: 1,
//     },
//     [PrefixType.LifeSteal]: {
//       combatAttributes: {},
//       equipmentTraits: {
//         [EquipmentTraitType.LifeSteal]: {
//           equipmentTraitType: EquipmentTraitType.LifeSteal,
//           value: 50,
//         },
//       },
//       tier: 10,
//     },
//     [PrefixType.PercentDamage]: {
//       combatAttributes: {},
//       equipmentTraits: {
//         [EquipmentTraitType.DamagePercentage]: {
//           equipmentTraitType: EquipmentTraitType.DamagePercentage,
//           value: 50,
//         },
//       },
//       tier: 1,
//     },
//   },
// };
