import {
  BASE_CRIT_CHANCE,
  BASE_CRIT_MULTIPLIER,
  CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO,
  STR_TO_MELEE_ARMOR_PEN_RATIO,
} from "../../../app-consts.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { IActionUser } from "../../../action-user-context/action-user.js";

export function getStandardActionCritChance(
  actionUser: IActionUser,
  critChanceAttributes: CombatAttribute[]
) {
  const userAttributes = actionUser.getTotalAttributes();
  let total = 0;
  for (const attribute of critChanceAttributes) {
    total += (userAttributes[attribute] || 0) * CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO;
  }

  return total + BASE_CRIT_CHANCE;
}

export function getStandardActionCritMultiplier(
  actionUser: IActionUser,
  critMultiplierAttribute: null | CombatAttribute
) {
  const critMultiplier = BASE_CRIT_MULTIPLIER;
  const userAttributes = actionUser.getTotalAttributes();
  let multiplierAttribute = 0;
  if (critMultiplierAttribute !== null)
    multiplierAttribute = userAttributes[critMultiplierAttribute] || 0;
  return critMultiplier + multiplierAttribute / 100;
}

export function getStandardActionArmorPenetration(
  user: IActionUser,
  bonusAttribute: null | CombatAttribute
) {
  const userAttributes = user.getTotalAttributes();
  let userArmorPen = userAttributes[CombatAttribute.ArmorPenetration] || 0;
  if (bonusAttribute === CombatAttribute.Strength) {
    userArmorPen += (userAttributes[CombatAttribute.Strength] || 0) * STR_TO_MELEE_ARMOR_PEN_RATIO;
  }

  return userArmorPen;
}
