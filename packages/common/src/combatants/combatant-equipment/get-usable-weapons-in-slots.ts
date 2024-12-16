import { Equipment, WeaponProperties } from "../../items/equipment/index.js";
import { HoldableSlot, HoldableSlotType } from "../../items/equipment/slots.js";
import { CombatantProperties } from "./../combatant-properties.js";
import { CombatantEquipment } from "./index.js";

export function getUsableWeaponsInSlots(
  combatantProperties: CombatantProperties,
  weaponSlots: HoldableSlot[]
) {
  const toReturn: Partial<
    Record<HoldableSlotType, { equipment: Equipment; weaponProperties: WeaponProperties }>
  > = {};

  const equippedSelectedHotswapSlot =
    CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  if (!equippedSelectedHotswapSlot) return toReturn;

  for (const weaponSlot of weaponSlots) {
    let equipmentSlot =
      weaponSlot.slot === HoldableSlotType.OffHand
        ? HoldableSlotType.OffHand
        : HoldableSlotType.MainHand;

    const holdable = equippedSelectedHotswapSlot.holdables[equipmentSlot];
    if (!holdable) continue;
    if (!CombatantProperties.canUseItem(combatantProperties, holdable)) continue;

    const weaponPropertiesResult = Equipment.getWeaponProperties(holdable);
    if (weaponPropertiesResult instanceof Error) continue; // could be a shield so just skip it
    toReturn[weaponSlot.type] = { equipment: holdable, weaponProperties: weaponPropertiesResult };
  }

  return toReturn;
}
