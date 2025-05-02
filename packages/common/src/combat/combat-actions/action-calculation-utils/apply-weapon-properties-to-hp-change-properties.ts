import { CombatantProperties } from "../../../combatants/index.js";
import { Equipment, WeaponProperties } from "../../../items/equipment/index.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import { ResourceChangeSourceModifiers } from "../../hp-change-source-types.js";
import { CombatActionHitOutcomeProperties } from "../combat-action-hit-outcome-properties.js";
import { CombatActionResourceChangeProperties } from "../combat-action-resource-change-properties.js";
import { addWeaponsDamageToRange } from "./add-weapon-damage-to-range.js";
import { copySelectedModifiersFromResourceChangeSource } from "./copy-selected-modifiers-from-hp-change-source.js";
import { selectMostEffectiveFromAvailableResourceChangeSourceModifiers } from "./select-most-effective-damage-classification-on-target.js";

export function applyWeaponPropertiesToResourceChangeProperties(
  hitOutcomeProperties: CombatActionHitOutcomeProperties,
  weapon: {
    equipment: Equipment;
    weaponProperties: WeaponProperties;
  },
  hpChangeProperties: CombatActionResourceChangeProperties,
  user: CombatantProperties,
  primaryTarget: CombatantProperties
) {
  const { baseValues } = hpChangeProperties;

  addWeaponsDamageToRange([weapon], baseValues);
  const weaponModifiersToCopy = new Set(iterateNumericEnum(ResourceChangeSourceModifiers));

  const averageRoll = baseValues.getAverage();
  const mostEffectiveAvailableResourceChangeSourceOnWeapon =
    selectMostEffectiveFromAvailableResourceChangeSourceModifiers(
      hitOutcomeProperties,
      hpChangeProperties,
      weapon.weaponProperties.damageClassification,
      weaponModifiersToCopy,
      user,
      primaryTarget,
      averageRoll
    );

  if (mostEffectiveAvailableResourceChangeSourceOnWeapon === undefined) return hpChangeProperties;

  // if we ever add another trait besides lifesteal which might affect damage, put those traits
  // before the testing for best hp change source modifiers
  const maybeError = Equipment.applyEquipmentTraitsToResourceChangeSource(
    weapon.equipment,
    mostEffectiveAvailableResourceChangeSourceOnWeapon
  );
  if (maybeError instanceof Error) console.error(maybeError);

  copySelectedModifiersFromResourceChangeSource(
    hpChangeProperties.resourceChangeSource,
    mostEffectiveAvailableResourceChangeSourceOnWeapon,
    weaponModifiersToCopy
  );
}
