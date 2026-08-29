// GENERATED FILE — do not edit by hand.
// Source: packages/balance-tools/game-data.xlsx
// Regenerate: yarn workspace @speed-dungeon/balance-tools sync
import {
  BodyArmor,
  CombatAttribute,
  CombatantClass,
  EquipmentType,
  HeadGear,
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
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.HardLeather,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.4,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.StuddedLeather,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.DemonsaurLeather,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Eyepatch,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.LeatherHat,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.33,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.LeatherHelm,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.DemonsaurHelm,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedRanged, mainClass: CombatantClass.Rogue, supportClass: CombatantClass.Warrior },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.RingMail,
    },
    studyName: StudyName.AttackDamageMixed,
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
    studyName: StudyName.AttackDamageMixed,
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
    studyName: StudyName.AttackDamageMixed,
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
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.66,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.OhmushellMail,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Dexterity, CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.Shields, mainClass: CombatantClass.Mage, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.BreastPlate,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.66,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.FieldPlate,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.GothicPlate,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.75,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.BodyArmor,
      baseItemType: BodyArmor.FullPlate,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.75,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Circlet,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.Crown,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.5,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.FullHelm,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.75,
  },
  {
    baseItem: {
      equipmentType: EquipmentType.HeadGear,
      baseItemType: HeadGear.GreatHelm,
    },
    studyName: StudyName.AttackDamageMixed,
    attributes: [CombatAttribute.Strength],
    buildSlice: { weaponSpecialty: CharacterWeaponSpecialty.TwoHandedMelee, mainClass: CombatantClass.Warrior, supportClass: CombatantClass.Rogue },
    availabilityPercentile: 0.75,
  },
];
