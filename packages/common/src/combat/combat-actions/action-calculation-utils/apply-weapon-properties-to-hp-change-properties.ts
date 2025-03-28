import { CombatantProperties } from "../../../combatants/index.js";
import {
  Equipment,
  ONE_HANDED_MELEE_WEAPON_NAMES,
  WeaponProperties,
} from "../../../items/equipment/index.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import { HpChangeSourceModifiers } from "../../hp-change-source-types.js";
import { KINETIC_DAMAGE_TYPE_STRINGS } from "../../kinetic-damage-types.js";
import { CombatActionHpChangeProperties } from "../combat-action-hp-change-properties.js";
import { CombatActionComponent } from "../index.js";
import { addWeaponsDamageToRange } from "./add-weapon-damage-to-range.js";
import { copySelectedModifiersFromHpChangeSource } from "./copy-selected-modifiers-from-hp-change-source.js";
import { selectMostEffectiveFromAvailableHpChangeSourceModifiers } from "./select-most-effective-damage-classification-on-target.js";

export function applyWeaponPropertiesToHpChangeProperties(
  action: CombatActionComponent,
  weapon: {
    equipment: Equipment;
    weaponProperties: WeaponProperties;
  },
  hpChangeProperties: CombatActionHpChangeProperties,
  user: CombatantProperties,
  primaryTarget: CombatantProperties
) {
  const { baseValues } = hpChangeProperties;

  addWeaponsDamageToRange([weapon], baseValues);
  const weaponModifiersToCopy = new Set(iterateNumericEnum(HpChangeSourceModifiers));

  const averageRoll = baseValues.getAverage();
  const mostEffectiveAvailableHpChangeSourceOnWeapon =
    selectMostEffectiveFromAvailableHpChangeSourceModifiers(
      action,
      hpChangeProperties,
      weapon.weaponProperties.damageClassification,
      weaponModifiersToCopy,
      user,
      primaryTarget,
      averageRoll
    );

  if (mostEffectiveAvailableHpChangeSourceOnWeapon === undefined) return hpChangeProperties;

  // if we ever add another trait besides lifesteal which might affect damage, put those traits
  // before the testing for best hp change source modifiers
  const maybeError = Equipment.applyEquipmentTraitsToHpChangeSource(
    weapon.equipment,
    mostEffectiveAvailableHpChangeSourceOnWeapon
  );
  if (maybeError instanceof Error) console.error(maybeError);

  copySelectedModifiersFromHpChangeSource(
    hpChangeProperties.hpChangeSource,
    mostEffectiveAvailableHpChangeSourceOnWeapon,
    weaponModifiersToCopy
  );
}
