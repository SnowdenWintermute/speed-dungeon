import { CombatantProperties } from "../../../../combatants/index.js";
import { WeaponProperties } from "../../../../items/index.js";
import { HpChangeSource, HpChangeSourceCategory } from "../../../hp-change-source-types.js";
import getDamageAfterArmorClass from "../get-damage-after-armor-class.js";
import getDamageAfterResilience from "../get-damage-after-resilience.js";

export function getMostEffectiveHpChangeSourceCategoryOnTargetAvailableOnThisWeapon(
  weaponOption: WeaponProperties,
  userCombatantProperties: CombatantProperties,
  targetCombatantProperties: CombatantProperties,
  initialRolledDamage: number
): null | HpChangeSourceCategory {
  if (!weaponOption) return null;

  const weaponProperties = weaponOption;

  const toSelectFrom: HpChangeSource[] = [];
  for (const hpChangeSource of weaponProperties.damageClassification)
    toSelectFrom.push(hpChangeSource);

  const userTotalAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
  const targetTotalAttributes = CombatantProperties.getTotalAttributes(targetCombatantProperties);

  // calculate would-be damage after each one
  let mostDamaging: null | { source: HpChangeSource; number: number } = null;
  for (const selectable of toSelectFrom) {
    let damageAterAc = 0;
    let damageAfterResilience = 0;
    let directDamage = 0;
    if (selectable.category === HpChangeSourceCategory.Physical)
      damageAterAc = getDamageAfterArmorClass(
        initialRolledDamage,
        userTotalAttributes,
        targetTotalAttributes,
        selectable.meleeOrRanged
      );
    else if (selectable.category === HpChangeSourceCategory.Magical)
      damageAfterResilience = getDamageAfterResilience(
        initialRolledDamage,
        userTotalAttributes,
        targetTotalAttributes
      );
    else if (selectable.category === HpChangeSourceCategory.Direct)
      directDamage = initialRolledDamage;

    const mostDamageForThisSource = Math.max(damageAterAc, damageAfterResilience, directDamage);

    if (mostDamaging === null || mostDamageForThisSource > mostDamaging.number) {
      mostDamaging = { source: selectable, number: mostDamageForThisSource };
    }
  }

  return mostDamaging?.source.category !== undefined ? mostDamaging.source.category : null;
}
