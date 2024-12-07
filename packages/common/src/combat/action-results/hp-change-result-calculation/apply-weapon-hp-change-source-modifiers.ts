import { CombatantProperties } from "../../../combatants/index.js";
import { WeaponProperties } from "../../../items/index.js";
import { HpChangeSource } from "../../hp-change-source-types.js";
import getMostDamagingWeaponKineticDamageTypeOnTarget from "./get-most-damaging-weapon-damage-type-on-target.js";
import getMostDamagingWeaponElementOnTarget from "./get-most-damaging-weapon-element-on-target.js";
import getMostDamagingHpChangeSourceCategoryOnTarget from "./get-most-damaging-weapon-hp-change-source-category-on-target.js";

export function applyWeaponElementToHpChangeSource(
  hpChangeSource: HpChangeSource,
  weaponPropertiesOption: undefined | WeaponProperties,
  targetProperties: CombatantProperties
) {
  if (!weaponPropertiesOption) return;
  const elementToAddOption = getMostDamagingWeaponElementOnTarget(
    weaponPropertiesOption,
    targetProperties
  );
  if (elementToAddOption !== null) hpChangeSource.elementOption = elementToAddOption;
}

export function applyWeaponKineticTypeToHpChangeSource(
  hpChangeSource: HpChangeSource,
  weaponPropertiesOption: undefined | WeaponProperties,
  targetProperties: CombatantProperties
) {
  if (!weaponPropertiesOption) return;
  const typeToAddOption = getMostDamagingWeaponKineticDamageTypeOnTarget(
    weaponPropertiesOption,
    targetProperties
  );
  if (typeToAddOption !== null) hpChangeSource.kineticDamageTypeOption = typeToAddOption;
}

export function applyWeaponHpChangeCategoryToHpChangeSource(
  hpChangeSource: HpChangeSource,
  weaponPropertiesOption: undefined | WeaponProperties,
  userProperties: CombatantProperties,
  targetProperties: CombatantProperties,
  incomingHpChangePerTarget: number
) {
  if (!weaponPropertiesOption) return;
  const hpChangeSourceCategoryToAddOption = getMostDamagingHpChangeSourceCategoryOnTarget(
    weaponPropertiesOption,
    userProperties,
    targetProperties,
    // we must include this because selecting the best damage type depends on how
    // much armor is mitigating, which depends on the asymptotic function of damage vs armor class
    incomingHpChangePerTarget
  );
  if (hpChangeSourceCategoryToAddOption === null) return;
  hpChangeSource.category = hpChangeSourceCategoryToAddOption;
}
