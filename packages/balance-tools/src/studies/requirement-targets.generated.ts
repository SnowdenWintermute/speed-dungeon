// GENERATED FILE — do not edit by hand.
// Source: packages/balance-tools/game-data.xlsx
// Regenerate: yarn workspace @speed-dungeon/balance-tools sync
import {
  BodyArmor,
  CombatAttribute,
  CombatantClass,
  EquipmentType,
  HeadGear,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import type { EquipmentRequirementTarget } from "./requirement-target.ts";
import { StudyName } from "./study-name.ts";

export const EQUIPMENT_REQUIREMENT_TARGETS: EquipmentRequirementTarget[] = [
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.Cloak,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.Robe,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.OfficersRobe,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.MageRobe,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Bandana,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.PaddedCap,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Ribbon,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.WizardHat,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.66,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.LeatherVest,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.HardLeather,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.4,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.StuddedLeather,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.DemonsaurLeather,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Eyepatch,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.LeatherHat,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.33,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.LeatherHelm,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.DemonsaurHelm,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.RingMail,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.RingMail,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.ChainMail,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.33,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.SplintMail,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.SplintMail,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.FeatherMail,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.66,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.FeatherMail,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.66,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.OhmushellMail,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Skullcap,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.33,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Coif,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Coif,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.OhmushellMask,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.BreastPlate,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.66,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.FieldPlate,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.GothicPlate,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.75,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.FullPlate,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.75,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Circlet,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Crown,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.FullHelm,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.75,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.GreatHelm,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.75,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Club,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Mace,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.33,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Morningstar,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.33,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.WarHammer,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.33,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.ShortSword,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.2,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Blade,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.2,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.BroadSword,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.2,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.BastardSword,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.2,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Dagger,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.Rapier,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.2,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.ShortSpear,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.2,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.RuneSword,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.EtherBlade,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.IceBlade,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.MapleWand,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.WillowWand,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.YewWand,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.OneHandedMeleeWeapon,
      baseItemType: OneHandedMeleeWeapon.RoseWand,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.BoStaff,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.Spear,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 1,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.Bardiche,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.SplittingMaul,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.Maul,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.BattleAxe,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.Glaive,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.ElementalStaff,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.Trident,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.GreatAxe,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.GravityHammer,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.75,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.ElmStaff,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.MahoganyStaff,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedMeleeWeapon,
      baseItemType: TwoHandedMeleeWeapon.EbonyStaff,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: TwoHandedRangedWeapon.ShortBow,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: TwoHandedRangedWeapon.RecurveBow,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: TwoHandedRangedWeapon.CompositeBow,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: TwoHandedRangedWeapon.MilitaryBow,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.TwoHandedRangedWeapon,
      baseItemType: TwoHandedRangedWeapon.EtherBow,
    },
    studyName: StudyName.CasterDamageMixed,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Spirit],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.25,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.Buckler,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.33,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.LanternShield,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.AncientBuckler,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.CabinetDoor,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.66,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.Heater,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.Aspis,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.KiteShield,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.GothicShield,
    },
    studyName: StudyName.CasterDualWieldRanged,
    attributes: [CombatAttribute.Strength, CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.DualWield, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.Pavise,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.Shield,
      baseItemType: Shield.TowerShield,
    },
    studyName: StudyName.AttackDamageGroupOne,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
];
