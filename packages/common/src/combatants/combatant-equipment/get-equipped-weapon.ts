import { EquipmentSlot, Item, WeaponSlot } from "../../items/index.js";
import { WeaponProperties } from "../../items/equipment/equipment-properties/weapon-properties.js";
import { CombatantProperties } from "./../combatant-properties.js";

export function getEquippedWeapon(
  combatantProperties: CombatantProperties,
  slot: WeaponSlot
): undefined | Error | WeaponProperties {
  const equipmentSlot =
    slot === WeaponSlot.OffHand ? EquipmentSlot.OffHand : EquipmentSlot.MainHand;
  const itemOption = combatantProperties.equipment[equipmentSlot];
  if (itemOption === undefined) return undefined;

  return Item.getWeaponProperties(itemOption);
}
