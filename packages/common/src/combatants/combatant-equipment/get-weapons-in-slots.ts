import { Equipment, WeaponProperties } from "../../items/equipment/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { CombatantProperties } from "../index.js";
import { CombatantEquipment } from "./index.js";

export function getWeaponsInSlots(
  combatantProperties: CombatantProperties,
  weaponSlots: HoldableSlotType[],
  options: { usableWeaponsOnly: boolean }
) {
  const toReturn: Partial<
    Record<HoldableSlotType, { equipment: Equipment; weaponProperties: WeaponProperties }>
  > = {};

  const equippedSelectedHotswapSlot =
    CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
  if (!equippedSelectedHotswapSlot) return toReturn;

  for (const weaponSlot of weaponSlots) {
    let equipmentSlot =
      weaponSlot === HoldableSlotType.OffHand
        ? HoldableSlotType.OffHand
        : HoldableSlotType.MainHand;

    const holdable = equippedSelectedHotswapSlot.holdables[equipmentSlot];
    if (!holdable) continue;
    if (
      options.usableWeaponsOnly &&
      (!CombatantProperties.combatantHasRequiredAttributesToUseItem(
        combatantProperties,
        holdable
      ) ||
        Equipment.isBroken(holdable))
    )
      continue;

    const weaponPropertiesResult = Equipment.getWeaponProperties(holdable);
    if (weaponPropertiesResult instanceof Error) continue; // could be a shield so just skip it
    toReturn[weaponSlot] = { equipment: holdable, weaponProperties: weaponPropertiesResult };
  }

  return toReturn;
}
