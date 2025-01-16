import { COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER } from "../../../app-consts.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { NumberRange } from "../../../primatives/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";

export function applyAdditiveAttributeToRange(
  range: NumberRange,
  combatantProperties: CombatantProperties,
  hpChangeProperties: CombatActionHpChangeProperties
) {
  if (!hpChangeProperties.additiveAttributeAndPercentScalingFactor) return range;

  const combatAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const combatantLevel = combatantProperties.level;

  const [additiveAttribute, percentScalingFactor] =
    hpChangeProperties.additiveAttributeAndPercentScalingFactor;

  const attributeValue = combatAttributes[additiveAttribute];

  const scalingMultiplier = percentScalingFactor / 100; // because we declare scaling as a whole number percent
  const scaledAttributeValue = attributeValue * scalingMultiplier;

  // higher combatant levels gain larger benefit from scaling attributes
  // @TODO - inspect this if things get out of hand
  const levelAdjustedValue =
    (scaledAttributeValue * combatantLevel) / COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER;

  range.min += levelAdjustedValue;
  range.max += levelAdjustedValue;
}
