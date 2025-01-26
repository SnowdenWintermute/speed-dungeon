import cloneDeep from "lodash.clonedeep";
import { HpChange, HpChangeSource, HpChangeSourceModifiers } from "../../hp-change-source-types.js";
import { HP_CALCLULATION_CONTEXTS } from "../../action-results/index.js";
import {
  applyElementalAffinities,
  applyKineticAffinities,
} from "./apply-affinities-to-hp-change.js";
import { CombatantProperties } from "../../../combatants";
import { convertHpChangeValueToFinalSign } from "./convert-hp-change-value-to-final-sign.js";
import { CombatActionHpChangeProperties } from "../combat-action-hp-change-properties";
import { copySelectedModifiersFromHpChangeSource } from "./copy-selected-modifiers-from-hp-change-source.js";
import { CombatActionComponent } from "../index.js";

export function selectMostEffectiveFromAvailableHpChangeSourceModifiers(
  action: CombatActionComponent,
  hpChangeProperties: CombatActionHpChangeProperties,
  toSelectFrom: HpChangeSource[],
  modifiers: Set<HpChangeSourceModifiers>,
  userCombatantProperties: CombatantProperties,
  targetCombatantProperties: CombatantProperties,
  expectedRolledValueAverage: number
) {
  const hpChangeToModify = new HpChange(
    expectedRolledValueAverage,
    hpChangeProperties.hpChangeSource
  );

  let mostEffective: null | {
    source: HpChangeSource;
    value: number;
  } = null;

  for (const hpChangeSource of toSelectFrom) {
    const hpChangeToTest = cloneDeep(hpChangeToModify);
    const source = hpChangeToTest.source;

    copySelectedModifiersFromHpChangeSource(source, hpChangeSource, modifiers);

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
      action,
      hpChangeToTest,
      userCombatantProperties,
      targetCombatantProperties
    );

    hpChangeToTest.value = Math.floor(hpChangeToModify.value);

    if (mostEffective !== null && hpChangeToTest.value < mostEffective.value) continue;

    mostEffective = {
      source: cloneDeep(hpChangeSource),
      value: hpChangeToTest.value,
    };
  }

  return mostEffective?.source;
}
