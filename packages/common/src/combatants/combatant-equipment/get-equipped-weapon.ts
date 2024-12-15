import { WeaponProperties } from "../../items/equipment/equipment-properties/weapon-properties.js";
import { Equipment } from "../../items/equipment/index.js";
import { EquipmentSlot, HoldableSlot } from "../../items/equipment/slots.js";
import { CombatantProperties } from "./../combatant-properties.js";

export function getEquippedWeapon(
  combatantProperties: CombatantProperties,
  slot: HoldableSlot
): undefined | Error | WeaponProperties {
  const equipmentSlot =
    slot === HoldableSlot.OffHand ? EquipmentSlot.OffHand : EquipmentSlot.MainHand;
  const itemOption = combatantProperties.equipment[equipmentSlot];
  if (itemOption === undefined) return undefined;

  return Equipment.getWeaponProperties(itemOption);
}
