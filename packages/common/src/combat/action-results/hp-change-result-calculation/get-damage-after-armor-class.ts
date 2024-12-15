import { ARMOR_CLASS_EQUATION_MODIFIER } from "../../../app-consts.js";
import { CombatAttribute } from "../../../attributes/index.js";
import { MeleeOrRanged } from "../../hp-change-source-types.js";
import getDerivedArmorPenAttributeBasedOnWeaponType from "./get-armor-pen-derived-attribute-based-on-weapon-type.js";

/** Expects a negative hp change value */
export default function getDamageAfterArmorClass(
  baseValue: number,
  userCombatAttributes: Record<CombatAttribute, number>,
  targetCombatAttributes: Record<CombatAttribute, number>,
  abilityRange: MeleeOrRanged
) {
  // since the formula is based on positive numbers and we have to calculate this
  // after converting to a negative hp change in order to check if the target even
  // wants to reduce this damage, we need to flip the sign just for this calulation
  // and flip it back at the end
  baseValue *= -1;
  const targetAc = targetCombatAttributes[CombatAttribute.ArmorClass];
  let userArmorPen = userCombatAttributes[CombatAttribute.ArmorPenetration];

  const armorPenBonusBasedOnWeaponType = getDerivedArmorPenAttributeBasedOnWeaponType(
    userCombatAttributes,
    abilityRange
  );

  userArmorPen += armorPenBonusBasedOnWeaponType;

  const finalAc = Math.max(0, targetAc - userArmorPen);
  const damageAfterAc =
    (ARMOR_CLASS_EQUATION_MODIFIER * Math.pow(baseValue, 2.0)) /
    (finalAc + ARMOR_CLASS_EQUATION_MODIFIER * baseValue);

  return damageAfterAc * -1;
}
