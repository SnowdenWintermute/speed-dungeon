import { ARMOR_CLASS_EQUATION_MODIFIER } from "../../../app-consts.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatActionComponent } from "../../combat-actions/index.js";

/** Expects a negative hp change value */
export default function getDamageAfterArmorClass(
  damageBefore: number,
  user: CombatantProperties,
  target: CombatantProperties,
  action: CombatActionComponent
) {
  // since the formula is based on positive numbers and we have to calculate this
  // after converting to a negative hp change in order to check if the target even
  // wants to reduce this damage, we need to flip the sign just for this calulation
  // and flip it back at the end
  damageBefore *= -1;

  const targetAc = CombatantProperties.getTotalAttributes(target)[CombatAttribute.ArmorClass];

  const userArmorPen = action.getArmorPenetration(user);

  const finalAc = Math.max(0, targetAc - userArmorPen);
  const damageAfterAc =
    (ARMOR_CLASS_EQUATION_MODIFIER * Math.pow(damageBefore, 2.0)) /
    (finalAc + ARMOR_CLASS_EQUATION_MODIFIER * damageBefore);

  // why flip the sign? see comment above
  return damageAfterAc * -1;
}
