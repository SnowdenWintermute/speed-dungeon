import {
  BASE_CRIT_CHANCE,
  CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO,
  MAX_CRIT_CHANCE,
} from "../../../app-consts.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";

export function getActionCritChance(
  hpChangeProperties: CombatActionHpChangeProperties,
  user: CombatantProperties,
  target: CombatantProperties,
  targetWantsToBeHit: boolean
) {
  const critChanceAttribute = hpChangeProperties.critChanceAttribute;
  if (critChanceAttribute === null) return BASE_CRIT_CHANCE;

  const userAttributes = CombatantProperties.getTotalAttributes(user);
  const userCritChanceAttributeValue =
    userAttributes[critChanceAttribute] * CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO;
  const targetAttributes = CombatantProperties.getTotalAttributes(target);
  const targetAvoidaceAttributeValue = targetAttributes[CombatAttribute.Resilience];

  const targetCritAvoidance = targetWantsToBeHit ? 0 : targetAvoidaceAttributeValue;
  let critChance = userCritChanceAttributeValue - targetCritAvoidance + BASE_CRIT_CHANCE;
  critChance *= (hpChangeProperties.critChanceModifier || 100) / 100;

  return Math.floor(Math.max(0, Math.min(MAX_CRIT_CHANCE, critChance)));
}
