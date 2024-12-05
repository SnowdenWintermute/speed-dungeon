import { ARMOR_CLASS_EQUATION_MODIFIER } from "../../../app-consts.js";
import { CombatAttribute } from "../../../combatants/index.js";
import { MeleeOrRanged } from "../../hp-change-source-types.js";
import getDerivedArmorPenAttributeBasedOnWeaponType from "./get-armor-pen-derived-attribute-based-on-weapon-type.js";

export default function getDamageAfterArmorClass(
  baseValue: number,
  userCombatAttributes: Record<CombatAttribute, number>,
  targetCombatAttributes: Record<CombatAttribute, number>,
  abilityRange: MeleeOrRanged
) {
  const targetAc = targetCombatAttributes[CombatAttribute.ArmorClass] || 0;
  let userArmorPen = userCombatAttributes[CombatAttribute.ArmorPenetration] || 0;

  const armorPenBonusBasedOnWeaponType = getDerivedArmorPenAttributeBasedOnWeaponType(
    userCombatAttributes,
    abilityRange
  );

  userArmorPen += armorPenBonusBasedOnWeaponType;
  const finalAc = Math.max(0, targetAc - userArmorPen);
  const damageAfterAc =
    (ARMOR_CLASS_EQUATION_MODIFIER * Math.pow(baseValue, 2.0)) /
    (finalAc + ARMOR_CLASS_EQUATION_MODIFIER * baseValue);

  return damageAfterAc;
}
