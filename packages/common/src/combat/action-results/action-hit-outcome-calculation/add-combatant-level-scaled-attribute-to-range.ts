import { COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER } from "../../../app-consts.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { CombatantAttributeRecord } from "../../../combatants/index.js";
import { NumberRange } from "../../../primatives/index.js";

/** Like in Diablo 1 where higher level combatants get greater benefits from attributes such as Strength -> Damage */
export function addCombatantLevelScaledAttributeToRange(config: {
  range: NumberRange;
  userTotalAttributes: CombatantAttributeRecord;
  userLevel: number;
  attribute: CombatAttribute;
  normalizedAttributeScalingByCombatantLevel: number;
}) {
  const {
    range,
    attribute,
    userLevel,
    userTotalAttributes,
    normalizedAttributeScalingByCombatantLevel,
  } = config;

  const combatAttributes = userTotalAttributes;
  const combatantLevel = userLevel;
  const attributeValue = combatAttributes[attribute] || 0;
  const scaledAttributeValue = attributeValue * normalizedAttributeScalingByCombatantLevel;

  // higher combatant levels gain larger benefit from scaling attributes
  // @TODO - inspect this if things get out of hand
  // in diablo the calculation for "character damage" (non weapon, just base unarmed)
  // for warriors is Strength * clvl / 100
  // Since we never get to level 50, we'll use a lower divisor
  const levelAdjustedValue =
    (scaledAttributeValue * combatantLevel) / COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER;

  range.add(levelAdjustedValue);
}
