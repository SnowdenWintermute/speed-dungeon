import { COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER } from "../../app_consts";
import { CombatantProperties } from "../../combatants";
import NumberRange from "../../primatives/number-range";
import addWeaponDamageToCombatActionHpChange from "./add-weapon-damage-to-hp-change-range";
import { CombatActionHpChangeProperties } from "./combat-action-properties";

export function calculateCombatActionHpChangeRange(
  userCombatantProperties: CombatantProperties,
  hpChangeProperties: CombatActionHpChangeProperties,
  abilityLevel: number,
  baseHpChangeValuesLevelMultiplier: number = 1
): Error | NumberRange {
  let userCombatAttributes = userCombatantProperties.getTotalAttributes();
  let combatantLevel = userCombatantProperties.level;

  let { min, max } = hpChangeProperties.baseValues;

  // add to base values if level greater than 1
  min = min * abilityLevel * baseHpChangeValuesLevelMultiplier;
  min = max * abilityLevel * baseHpChangeValuesLevelMultiplier;

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

  return hpChangeRange;
}
