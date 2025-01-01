import { CombatAction, CombatActionType } from "../index.js";
import { DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME } from "../../app-consts.js";
import { AbilityName, CombatantProperties } from "../../combatants/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { Equipment } from "../../items/equipment/index.js";
import { CombatantEquipment } from "../../combatants/combatant-equipment/index.js";

export function getCombatActionExecutionTime(
  combatantProperties: CombatantProperties,
  combatAction: CombatAction
) {
  let ms = DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME;
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      switch (combatAction.abilityName) {
        case AbilityName.Attack:
        case AbilityName.AttackMeleeMainhand:
        case AbilityName.AttackMeleeOffhand:
          const equippedHoldableHotswapSlot =
            CombatantEquipment.getEquippedHoldableSlots(combatantProperties);
          const mhWeaponOption = equippedHoldableHotswapSlot?.holdables[HoldableSlotType.MainHand];
          if (!mhWeaponOption) return 1000;

          const isTwoHanded = Equipment.isTwoHanded(
            mhWeaponOption.equipmentBaseItemProperties.type
          );
          if (isTwoHanded) ms = 2000;
          else ms = 1000;
          break;
        case AbilityName.AttackRangedMainhand:
        case AbilityName.Fire:
        case AbilityName.Ice:
        case AbilityName.Healing:
          ms = 2000;
          break;
      }
      break;
    case CombatActionType.ConsumableUsed:
      ms = DEFAULT_COMBAT_ACTION_PERFORMANCE_TIME;
  }

  // const combatantSpeed =
  //   CombatantProperties.getTotalAttributes(combatantProperties)[CombatAttribute.Speed];

  return ms;
}

function calculateExecutionTime(baseTime: number, speed: number): number {
  if (speed <= 0) throw new Error("Speed must be greater than 0.");
  const k = 1 / 9; // Scaling factor
  return baseTime / (1 + k * (Math.sqrt(speed) - 1));
}
