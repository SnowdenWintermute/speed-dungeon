import { CombatantProperties } from "../../../../combatants/index.js";
import { Item, WeaponProperties, WeaponSlot } from "../../../../items/index.js";
import { CombatActionHpChangeProperties } from "../../../combat-actions/combat-action-properties.js";
import { HpChangeSource } from "../../../hp-change-source-types.js";
import { getMostEffectiveWeaponElementOnTarget } from "./get-most-effective-weapon-element-on-target.js";
import { getMostEffectiveHpChangeSourceCategoryOnTargetAvailableOnThisWeapon } from "./get-most-effective-weapon-hp-change-source-category-on-target.js";
import { getMostEffectiveWeaponKineticTypeOnTarget } from "./get-most-effective-weapon-kinetic-type-on-target.js";

export function applyWeaponHpChangeModifiers(
  hpChangeProperties: CombatActionHpChangeProperties,
  equippedUsableWeapons: Partial<
    Record<WeaponSlot, { item: Item; weaponProperties: WeaponProperties }>
  >,
  userCombatantProperties: CombatantProperties,
  targetCombatantProperties: CombatantProperties,
  expectedRolledValueAverage: number
) {
  const { hpChangeSource } = hpChangeProperties;

  // collect category, kinetic and element from each weapons source
  // compare rolled expected avg value with each source
  // select best
  // apply to hp change source

  const weaponToAddHpChangeCategoryFrom =
    hpChangeProperties.addWeaponHpChangeSourceCategoryFromSlot !== null
      ? equippedUsableWeapons[hpChangeProperties.addWeaponHpChangeSourceCategoryFromSlot]
          ?.weaponProperties
      : undefined;
  applyWeaponHpChangeCategoryToHpChangeSource(
    hpChangeSource,
    weaponToAddHpChangeCategoryFrom,
    userCombatantProperties,
    targetCombatantProperties,
    expectedRolledValueAverage
  );

  const weaponToAddKineticTypeFrom =
    hpChangeProperties.addWeaponKineticDamageTypeFromSlot !== null
      ? equippedUsableWeapons[hpChangeProperties.addWeaponKineticDamageTypeFromSlot]
          ?.weaponProperties
      : undefined;
  applyWeaponKineticTypeToHpChangeSource(
    hpChangeSource,
    weaponToAddKineticTypeFrom,
    targetCombatantProperties
  );

  const weaponToAddElementFrom =
    hpChangeProperties.addWeaponElementFromSlot !== null
      ? equippedUsableWeapons[hpChangeProperties.addWeaponElementFromSlot]?.weaponProperties
      : undefined;
  applyWeaponElementToHpChangeSource(
    hpChangeSource,
    weaponToAddElementFrom,
    targetCombatantProperties
  );
}

export function applyWeaponElementToHpChangeSource(
  hpChangeSource: HpChangeSource,
  weaponPropertiesOption: undefined | WeaponProperties,
  targetProperties: CombatantProperties
) {
  if (!weaponPropertiesOption) return;
  const elementToAddOption = getMostEffectiveWeaponElementOnTarget(
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
  if (!weaponPropertiesOption) {
    return console.log("no weapon to add kinetic for");
  }
  const typeToAddOption = getMostEffectiveWeaponKineticTypeOnTarget(
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
  expectedRolledValueAverage: number
) {
  if (!weaponPropertiesOption) return;
  const hpChangeSourceCategoryToAddOption =
    getMostEffectiveHpChangeSourceCategoryOnTargetAvailableOnThisWeapon(
      weaponPropertiesOption,
      userProperties,
      targetProperties,
      // we must include this because selecting the best damage type depends on how
      // much armor is mitigating, which depends on the asymptotic function of damage vs armor class
      expectedRolledValueAverage
    );
  if (hpChangeSourceCategoryToAddOption === null) return;
  hpChangeSource.category = hpChangeSourceCategoryToAddOption;
}
