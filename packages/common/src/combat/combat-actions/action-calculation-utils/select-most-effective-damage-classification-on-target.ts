import cloneDeep from "lodash.clonedeep";
import {
  ResourceChange,
  ResourceChangeSource,
  ResourceChangeSourceModifiers,
} from "../../hp-change-source-types.js";
import { HP_CALCLULATION_CONTEXTS } from "../../action-results/index.js";
import {
  applyElementalAffinities,
  applyKineticAffinities,
} from "./apply-affinities-to-hp-change.js";
import { CombatantProperties } from "../../../combatants";
import { convertResourceChangeValueToFinalSign } from "./convert-hp-change-value-to-final-sign.js";
import { CombatActionResourceChangeProperties } from "../combat-action-resource-change-properties";
import { copySelectedModifiersFromResourceChangeSource } from "./copy-selected-modifiers-from-hp-change-source.js";
import { CombatActionHitOutcomeProperties } from "../combat-action-hit-outcome-properties.js";

export function selectMostEffectiveFromAvailableResourceChangeSourceModifiers(
  hitOutcomeProperties: CombatActionHitOutcomeProperties,
  hpChangeProperties: CombatActionResourceChangeProperties,
  toSelectFrom: ResourceChangeSource[],
  modifiers: Set<ResourceChangeSourceModifiers>,
  userCombatantProperties: CombatantProperties,
  targetCombatantProperties: CombatantProperties,
  expectedRolledValueAverage: number
) {
  const hpChangeToModify = new ResourceChange(
    expectedRolledValueAverage,
    hpChangeProperties.resourceChangeSource
  );

  let mostEffective: null | {
    source: ResourceChangeSource;
    value: number;
  } = null;

  for (const hpChangeSource of toSelectFrom) {
    const hpChangeToTest = cloneDeep(hpChangeToModify);
    const source = hpChangeToTest.source;

    copySelectedModifiersFromResourceChangeSource(source, hpChangeSource, modifiers);

    const hpChangeCalculationContext = HP_CALCLULATION_CONTEXTS[source.category];

    applyKineticAffinities(hpChangeToTest, targetCombatantProperties);
    applyElementalAffinities(hpChangeToTest, targetCombatantProperties);

    convertResourceChangeValueToFinalSign(hpChangeToTest, targetCombatantProperties);

    hpChangeCalculationContext.applyResilience(
      hpChangeToTest,
      userCombatantProperties,
      targetCombatantProperties
    );
    hpChangeCalculationContext.applyArmorClass(
      hitOutcomeProperties,
      hpChangeToTest,
      userCombatantProperties,
      targetCombatantProperties
    );

    hpChangeToTest.value = Math.trunc(hpChangeToTest.value);

    if (mostEffective !== null) {
      if (
        hpChangeProperties.resourceChangeSource.isHealing &&
        hpChangeToTest.value < mostEffective.value
      )
        continue;
      else if (hpChangeToTest.value > mostEffective.value) continue;
    }

    mostEffective = {
      source: cloneDeep(hpChangeSource),
      value: hpChangeToTest.value,
    };
  }

  return mostEffective?.source;
}
