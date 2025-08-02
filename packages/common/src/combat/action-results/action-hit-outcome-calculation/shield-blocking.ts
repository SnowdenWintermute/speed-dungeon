import { CombatantEquipment, CombatantProperties } from "../../../combatants/index.js";
import {
  SHIELD_SIZE_BLOCK_RATE,
  SHIELD_SIZE_DAMAGE_REDUCTION,
} from "../../../items/equipment/index.js";
import { Percentage } from "../../../primatives/index.js";

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
