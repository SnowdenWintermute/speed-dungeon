// GENERATED FILE — do not edit by hand.
// Source: the attack-damage-mixed study in packages/balance-tools
// Regenerate by running that study and pressing "generate equipment requirements".
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
];
