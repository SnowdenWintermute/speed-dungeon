import {
  BASE_CRIT_CHANCE,
  BASE_CRIT_MULTIPLIER,
  CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO,
  DEX_TO_RANGED_ARMOR_PEN_RATIO,
  STR_TO_MELEE_ARMOR_PEN_RATIO,
} from "../../../app-consts.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";

export function getStandardActionCritChance(
  actionUser: CombatantProperties,
  critChanceAttribute: CombatAttribute
) {
  const userAttributes = CombatantProperties.getTotalAttributes(actionUser);
  const userCritChanceAttributeValue =
    userAttributes[critChanceAttribute] * CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO;
  return userCritChanceAttributeValue + BASE_CRIT_CHANCE;
}

export function getStandardActionCritMultiplier(
  actionUser: CombatantProperties,
  critMultiplierAttribute: null | CombatAttribute
) {
  let critMultiplier = BASE_CRIT_MULTIPLIER;
  const userAttributes = CombatantProperties.getTotalAttributes(actionUser);
  let multiplierAttribute = 0;
  if (critMultiplierAttribute !== null)
    multiplierAttribute = userAttributes[critMultiplierAttribute] || 0;
  return critMultiplier + multiplierAttribute / 100;
}

export function getStandardActionArmorPenetration(
  user: CombatantProperties,
  bonusAttribute: CombatAttribute
) {
  const userAttributes = CombatantProperties.getTotalAttributes(user);
  let userArmorPen = userAttributes[CombatAttribute.ArmorPenetration];
  if (bonusAttribute === CombatAttribute.Strength)
    userArmorPen += userAttributes[CombatAttribute.Strength] * STR_TO_MELEE_ARMOR_PEN_RATIO;
  if (bonusAttribute === CombatAttribute.Dexterity)
    userArmorPen += userAttributes[CombatAttribute.Dexterity] * DEX_TO_RANGED_ARMOR_PEN_RATIO;

  return userArmorPen;
}
