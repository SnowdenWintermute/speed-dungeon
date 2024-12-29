import cloneDeep from "lodash.clonedeep";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatActionHpChangeProperties } from "../../../combat-actions/combat-action-properties.js";
import {
  HpChange,
  HpChangeSource,
  HpChangeSourceModifiers,
} from "../../../hp-change-source-types.js";
import { convertHpChangeValueToFinalSign } from "../convert-hp-change-value-to-final-sign.js";
import {
  applyElementalAffinities,
  applyKineticAffinities,
} from "../apply-affinites-to-hp-change.js";
import { HP_CALCLULATION_CONTEXTS } from "../hp-change-calculation-strategies/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { Equipment, WeaponProperties } from "../../../../items/equipment/index.js";

export function applyWeaponHpChangeModifiers(
  hpChangeProperties: CombatActionHpChangeProperties,
  equippedUsableWeapons: Partial<
    Record<HoldableSlotType, { equipment: Equipment; weaponProperties: WeaponProperties }>
  >,
  userCombatantProperties: CombatantProperties,
  targetCombatantProperties: CombatantProperties,
  expectedRolledValueAverage: number
) {
  const hpChange = new HpChange(expectedRolledValueAverage, hpChangeProperties.hpChangeSource);

  if (!hpChangeProperties.addWeaponModifiersFromSlot) return;
  const { slot, modifiers } = hpChangeProperties.addWeaponModifiersFromSlot;
  const weaponOption = equippedUsableWeapons[slot];
  if (weaponOption === undefined) return;

  let mostEffectiveClassificationOnTarget: null | {
    classification: HpChangeSource;
    value: number;
  } = null;

  for (const classification of weaponOption.weaponProperties.damageClassification) {
    const hpChangeToTest = cloneDeep(hpChange);
    const source = hpChangeToTest.source;

    applyWeaponModifiersToHpChangeSource(source, classification, modifiers);

    const hpChangeCalculationContext = HP_CALCLULATION_CONTEXTS[source.category];

    applyKineticAffinities(hpChangeToTest, targetCombatantProperties);
    applyElementalAffinities(hpChangeToTest, targetCombatantProperties);
    convertHpChangeValueToFinalSign(hpChangeToTest, targetCombatantProperties);
    hpChangeCalculationContext.applyResilience(
      hpChangeToTest,
      userCombatantProperties,
      targetCombatantProperties
    );
    hpChangeCalculationContext.applyArmorClass(
      hpChangeToTest,
      userCombatantProperties,
      targetCombatantProperties
    );

    hpChangeToTest.value = Math.floor(hpChange.value);

    if (
      mostEffectiveClassificationOnTarget === null ||
      hpChangeToTest.value < mostEffectiveClassificationOnTarget.value
    )
      mostEffectiveClassificationOnTarget = {
        classification: cloneDeep(classification),
        value: hpChangeToTest.value,
      };
  }

  if (mostEffectiveClassificationOnTarget) {
    // if we ever add something besides lifesteal which might affect damage, put this
    // before the testing
    const maybeError = Equipment.applyEquipmentTraitsToHpChangeSource(
      weaponOption.equipment,
      mostEffectiveClassificationOnTarget.classification
    );
    if (maybeError instanceof Error) console.error(maybeError);

    applyWeaponModifiersToHpChangeSource(
      hpChange.source,
      mostEffectiveClassificationOnTarget.classification,
      modifiers
    );
  }
}

export function applyWeaponModifiersToHpChangeSource(
  source: HpChangeSource,
  classification: HpChangeSource,
  modifiers: Set<HpChangeSourceModifiers>
) {
  for (const modifier of modifiers) {
    switch (modifier) {
      case HpChangeSourceModifiers.KineticType:
        source.kineticDamageTypeOption = classification.kineticDamageTypeOption;
        break;
      case HpChangeSourceModifiers.MagicalElement:
        source.elementOption = classification.elementOption;
        break;
      case HpChangeSourceModifiers.SourceCategory:
        source.category = classification.category;
        break;
      case HpChangeSourceModifiers.Lifesteal:
        if (classification.lifestealPercentage)
          source.lifestealPercentage
            ? (source.lifestealPercentage += classification.lifestealPercentage)
            : (source.lifestealPercentage = classification.lifestealPercentage);
    }
  }
}
