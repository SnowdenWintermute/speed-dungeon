import { CombatantEquipment, CombatantProperties } from "../../../combatants/index.js";
import { EquipmentType, SHIELD_SIZE_DAMAGE_REDUCTION } from "../../../items/equipment/index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../items/equipment/slots.js";

/**Should return a normalized percentage*/
export function getShieldBlockDamageReduction(combatantProperties: CombatantProperties) {
  const offhandOption = CombatantEquipment.getEquipmentInSlot(combatantProperties, {
    type: EquipmentSlotType.Holdable,
    slot: HoldableSlotType.OffHand,
  });
  if (!offhandOption) return 0;
  if (offhandOption.equipmentBaseItemProperties.equipmentType !== EquipmentType.Shield) return 0;
  const shieldProperties = offhandOption.equipmentBaseItemProperties;
  const baseDamageReduction = SHIELD_SIZE_DAMAGE_REDUCTION[shieldProperties.size];

  return baseDamageReduction + shieldProperties.armorClass / 10;

  // FFXI formula:
  // PercentDamageBlocked = SizeDamageReduction + (ShieldDEF / ((max(ShieldItemLevel, 99) - 99) / 10 + 2))
}
