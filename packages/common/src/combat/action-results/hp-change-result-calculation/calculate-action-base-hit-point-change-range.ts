import cloneDeep from "lodash.clonedeep";
import { CombatantProperties } from "../../../combatants";
import { SpeedDungeonGame } from "../../../game";
import { CombatActionHpChangeProperties } from "../../combat-actions";
import { COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER } from "../../../app_consts";

export default function calculateActionBaseHitPointChangeRange(
  game: SpeedDungeonGame,
  userCombatantProperties: CombatantProperties,
  hpChangeProperties: CombatActionHpChangeProperties,
  abilityLevelAndBaseValueScalingFactorOption: null | [number, number]
) {
  const combatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
  const combatantLevel = userCombatantProperties.level;

  let range = cloneDeep(hpChangeProperties.baseValues);
  if (abilityLevelAndBaseValueScalingFactorOption !== null) {
    const [abilityLevel, abilityLevelScalingFactor] = abilityLevelAndBaseValueScalingFactorOption;
    range.min *= abilityLevel * abilityLevelScalingFactor;
    range.max *= abilityLevel * abilityLevelScalingFactor;
  }
  if (hpChangeProperties.additiveAttributeAndPercentScalingFactor !== null) {
    const [additiveAttribute, attributePercentScalingFactor] =
      hpChangeProperties.additiveAttributeAndPercentScalingFactor;
    const attributeValue = combatAttributes[additiveAttribute] || 0;
    const scaledAttributeAdditiveValue = attributeValue * (attributePercentScalingFactor / 100);
    const combatantLevelAdjustedValue =
      (scaledAttributeAdditiveValue * combatantLevel) / COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER;

    range.min += combatantLevelAdjustedValue;
    range.max += combatantLevelAdjustedValue;
  }

  if (hpChangeProperties.addWeaponDamageFrom !== null) {
    // get weapon damage additive range
  }

  return range;
}
