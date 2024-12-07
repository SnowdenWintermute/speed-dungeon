import { COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER } from "../../app-consts.js";
import { CombatantProperties } from "../../combatants/index.js";
import { NumberRange } from "../../primatives/number-range.js";
import { CombatActionHpChangeProperties } from "./combat-action-properties.js";

export function calculateCombatActionHpChangeRange(
  userCombatantProperties: CombatantProperties,
  hpChangeProperties: CombatActionHpChangeProperties,
  actionLevel: number,
  baseHpChangeValuesActionLevelMultiplier: number
): NumberRange {
  let userCombatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
  let combatantLevel = userCombatantProperties.level;

  let { min, max } = hpChangeProperties.baseValues;

  // add to base values if level greater than 1
  min = min * actionLevel * baseHpChangeValuesActionLevelMultiplier;
  max = max * actionLevel * baseHpChangeValuesActionLevelMultiplier;

  // add scaling attribute to range
  if (hpChangeProperties.additiveAttributeAndPercentScalingFactor) {
    const [additiveAttribute, percentScalingFactor] =
      hpChangeProperties.additiveAttributeAndPercentScalingFactor;
    const attributeValue = userCombatAttributes[additiveAttribute];
    const scaledAttributeValue = attributeValue * (percentScalingFactor / 100);
    const levelAdjustedValue =
      (scaledAttributeValue * combatantLevel) / COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER;
    min += levelAdjustedValue;
    max += levelAdjustedValue;
  }
  const hpChangeRange = new NumberRange(min, max);

  hpChangeRange.min = Math.floor(hpChangeRange.min);
  hpChangeRange.max = Math.floor(hpChangeRange.max);

  return hpChangeRange;
}
