import { CombatantEquipment, CombatantProperties } from "../../../combatants/index.js";
import {
  SHIELD_SIZE_BLOCK_RATE,
  SHIELD_SIZE_DAMAGE_REDUCTION,
} from "../../../items/equipment/index.js";

export function getShieldBlockChance(
  aggressor: CombatantProperties,
  defender: CombatantProperties
) {
  const shieldPropertiesOption = CombatantEquipment.getEquippedShieldProperties(defender);
  if (!shieldPropertiesOption) return 0;

  const baseBlockRate = SHIELD_SIZE_BLOCK_RATE[shieldPropertiesOption.size] * 100;

  return baseBlockRate;

  // FFXI formula: BlockRate = SizeBaseBlockRate + ((ShieldSkill - AttackerCombatSkill) × 0.2325)
}

/**Should return a normalized percentage*/
export function getShieldBlockDamageReduction(combatantProperties: CombatantProperties) {
  const shieldPropertiesOption =
    CombatantEquipment.getEquippedShieldProperties(combatantProperties);
  if (!shieldPropertiesOption) return 0;

  const baseDamageReduction = SHIELD_SIZE_DAMAGE_REDUCTION[shieldPropertiesOption.size];

  return baseDamageReduction + shieldPropertiesOption.armorClass / 200;

  // FFXI formula:
  // PercentDamageBlocked = SizeDamageReduction + (ShieldDEF / ((max(ShieldItemLevel, 99) - 99) / 10 + 2))
}
