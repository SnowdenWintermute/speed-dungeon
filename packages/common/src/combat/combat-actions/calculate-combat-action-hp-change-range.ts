import { COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER } from "../../app-consts.js";
import { CombatantProperties } from "../../combatants/index.js";
import { NumberRange } from "../../primatives/number-range.js";
import addWeaponDamageToCombatActionHpChange from "./add-weapon-damage-to-hp-change-range.js";
import { CombatActionHpChangeProperties } from "./combat-action-properties.js";

export function calculateCombatActionHpChangeRange(
  userCombatantProperties: CombatantProperties,
  hpChangeProperties: CombatActionHpChangeProperties,
  actionLevel: number,
  baseHpChangeValuesActionLevelMultiplier: number
): Error | NumberRange {
  let userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
  let combatantLevel = userCombatantProperties.level;

  let { min, max } = hpChangeProperties.baseValues;

  // add to base values if level greater than 1
  min = min * actionLevel * baseHpChangeValuesActionLevelMultiplier;
  min = max * actionLevel * baseHpChangeValuesActionLevelMultiplier;

  // add scaling attribute to range
  if (hpChangeProperties.additiveAttributeAndPercentScalingFactor) {
    const [additiveAttribute, percentScalingFactor] =
      hpChangeProperties.additiveAttributeAndPercentScalingFactor;
    const attributeValue = userCombatAttributes[additiveAttribute] || 0;
    const scaledAttributeValue = attributeValue * (percentScalingFactor / 100);
    const levelAdjustedValue =
      (scaledAttributeValue * combatantLevel) / COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER;
    min += levelAdjustedValue;
    max += levelAdjustedValue;
  }
  // if weapon damage, determine main/off hand and add appropriate damage to range
  const hpChangeRange = new NumberRange(min, max);
  if (hpChangeProperties.addWeaponDamageFrom) {
    addWeaponDamageToCombatActionHpChange(
      hpChangeProperties.addWeaponDamageFrom,
      userCombatantProperties,
      hpChangeRange
    );
  }

  hpChangeRange.min = Math.floor(hpChangeRange.min);
  hpChangeRange.max = Math.floor(hpChangeRange.max);

  return hpChangeRange;
}
