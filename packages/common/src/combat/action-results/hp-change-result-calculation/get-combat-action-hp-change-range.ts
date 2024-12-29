import { CombatantProperties } from "../../../combatants/index.js";
import { Equipment, WeaponProperties } from "../../../items/equipment/index.js";
import { HoldableSlotType } from "../../../items/equipment/slots.js";
import { NumberRange } from "../../../primatives/index.js";
import { CombatAction, CombatActionHpChangeProperties } from "../../combat-actions/index.js";
import { applyAdditiveAttributeToRange } from "./apply-additive-attribute-to-range.js";
import { getCombatActionLevelAndHpChangeModifier } from "./get-combat-action-level-and-hp-change-modifier.js";
import { scaleRangeToActionLevel } from "./scale-hp-range-to-action-level.js";
import { addWeaponsDamageToRange } from "./weapon-hp-change-modifiers/add-weapons-damage-to-range.js";

export function getCombatActionHpChangeRange(
  combatAction: CombatAction,
  hpChangeProperties: CombatActionHpChangeProperties,
  userCombatantProperties: CombatantProperties,
  equippedUsableWeapons: Partial<
    Record<
      HoldableSlotType,
      {
        equipment: Equipment;
        weaponProperties: WeaponProperties;
      }
    >
  >
) {
  const actionLevelandModifierResult = getCombatActionLevelAndHpChangeModifier(
    combatAction,
    userCombatantProperties
  );
  if (actionLevelandModifierResult instanceof Error) return actionLevelandModifierResult;
  const { actionLevel, actionLevelHpChangeModifier } = actionLevelandModifierResult;

  const { min, max } = hpChangeProperties.baseValues;
  const hpChangeRange = new NumberRange(min, max);
  scaleRangeToActionLevel(hpChangeRange, actionLevel, actionLevelHpChangeModifier);
  applyAdditiveAttributeToRange(hpChangeRange, userCombatantProperties, hpChangeProperties);

  const weaponsToAddDamageFrom: Partial<
    Record<HoldableSlotType, { equipment: Equipment; weaponProperties: WeaponProperties }>
  > = {};
  for (const slot of hpChangeProperties.addWeaponDamageFromSlots || []) {
    const weapon = equippedUsableWeapons[slot];
    if (!weapon) continue;
    weaponsToAddDamageFrom[slot] = weapon;
  }

  addWeaponsDamageToRange(weaponsToAddDamageFrom, hpChangeRange);

  // do this here so displaying range in tooltip makes sense
  const flatRangeMultiplier = hpChangeProperties.finalDamagePercentMultiplier / 100;
  hpChangeRange.min *= flatRangeMultiplier;
  hpChangeRange.max *= flatRangeMultiplier;

  hpChangeRange.min = Math.max(1, Math.floor(hpChangeRange.min));
  hpChangeRange.max = Math.max(1, Math.floor(hpChangeRange.max));

  return hpChangeRange;
}
