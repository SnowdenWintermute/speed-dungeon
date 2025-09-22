import { WeaponProperties } from "../../items/equipment/equipment-properties/weapon-properties.js";
import { Equipment } from "../../items/equipment/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { CombatantProperties } from "../index.js";
import { CombatantEquipment } from "./index.js";

export function getEquippedWeapon(
  combatantProperties: CombatantProperties,
  holdableSlot: HoldableSlotType
): undefined | Error | WeaponProperties {
  const itemOption = CombatantEquipment.getEquippedHoldable(
    combatantProperties.equipment,
    holdableSlot
  );
  if (itemOption === undefined) return undefined;

  return Equipment.getWeaponProperties(itemOption);
}
