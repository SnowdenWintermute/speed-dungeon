import {
  BASE_CRIT_CHANCE,
  BASE_CRIT_MULTIPLIER,
  CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO,
  DEX_TO_RANGED_ARMOR_PEN_RATIO,
  STR_TO_MELEE_ARMOR_PEN_RATIO,
} from "../../../app-consts.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { IActionUser } from "../../../combatant-context/action-user.js";

export function getStandardActionCritChance(
  actionUser: IActionUser,
  critChanceAttribute: CombatAttribute
) {
  const userAttributes = actionUser.getTotalAttributes();
  const userCritChanceAttributeValue =
    (userAttributes[critChanceAttribute] || 0) * CRIT_ATTRIBUTE_TO_CRIT_CHANCE_RATIO;
  return userCritChanceAttributeValue + BASE_CRIT_CHANCE;
}

export function getStandardActionCritMultiplier(
  actionUser: IActionUser,
  critMultiplierAttribute: null | CombatAttribute
) {
  let critMultiplier = BASE_CRIT_MULTIPLIER;
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
  if (bonusAttribute === CombatAttribute.Strength)
    userArmorPen += (userAttributes[CombatAttribute.Strength] || 0) * STR_TO_MELEE_ARMOR_PEN_RATIO;
  if (bonusAttribute === CombatAttribute.Dexterity)
    userArmorPen +=
      (userAttributes[CombatAttribute.Dexterity] || 0) * DEX_TO_RANGED_ARMOR_PEN_RATIO;

  return userArmorPen;
}
