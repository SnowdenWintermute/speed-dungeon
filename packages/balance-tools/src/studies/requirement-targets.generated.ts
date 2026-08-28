// GENERATED FILE — do not edit by hand.
// Source: packages/balance-tools/game-data.xlsx
// Regenerate with: yarn workspace @speed-dungeon/balance-tools sync
import {
  BodyArmor,
  CombatAttribute,
  CombatantClass,
  EquipmentType,
} from "@speed-dungeon/common";
import { CharacterWeaponSpecialty } from "../analysis-subjects/character-weapon-specialty.ts";
import type { EquipmentRequirementTarget } from "./requirement-target.ts";
import { StudyName } from "./study-name.ts";

export const EQUIPMENT_REQUIREMENT_TARGETS: EquipmentRequirementTarget[] = [
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
];
