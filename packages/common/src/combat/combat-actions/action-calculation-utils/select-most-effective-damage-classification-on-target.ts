import cloneDeep from "lodash.clonedeep";
import {
  ResourceChange,
  ResourceChangeSource,
  ResourceChangeSourceModifiers,
} from "../../hp-change-source-types.js";
import { ResourceChangeModifier } from "../../action-results/index.js";
import { CombatActionResourceChangeProperties } from "../combat-action-resource-change-properties";
import { copySelectedModifiersFromResourceChangeSource } from "./copy-selected-modifiers-from-hp-change-source.js";
import { CombatActionHitOutcomeProperties } from "../combat-action-hit-outcome-properties.js";
import { IActionUser } from "../../../action-user-context/action-user.js";
import { CombatantProperties } from "../../../combatants/combatant-properties.js";
import { toJS } from "mobx";

export function selectMostEffectiveFromAvailableResourceChangeSourceModifiers(
  hitOutcomeProperties: CombatActionHitOutcomeProperties,
  hpChangeProperties: CombatActionResourceChangeProperties,
  toSelectFrom: ResourceChangeSource[],
  modifiers: Set<ResourceChangeSourceModifiers>,
  user: IActionUser,
  actionLevel: number,
  targetCombatantProperties: CombatantProperties,
  expectedRolledValueAverage: number,
  targetWillAttemptMitigation: boolean
) {
  const hpChangeToModify = new ResourceChange(
    expectedRolledValueAverage,
    hpChangeProperties.resourceChangeSource
  );

  const resourceChangeModifier = new ResourceChangeModifier(
    hitOutcomeProperties,
    user,
    targetCombatantProperties,
    targetWillAttemptMitigation,
    hpChangeToModify
  );

  let mostEffective: null | {
    source: ResourceChangeSource;
    value: number;
  } = null;

  for (const hpChangeSource of toSelectFrom) {
    const hpChangeToTest = cloneDeep(hpChangeToModify);
    resourceChangeModifier.setResourceChange(hpChangeToTest);

    const source = hpChangeToTest.source;

    copySelectedModifiersFromResourceChangeSource(source, hpChangeSource, modifiers);

    resourceChangeModifier.applyPostHitModifiers(false, actionLevel);

    if (mostEffective !== null) {
      if (
        hpChangeProperties.resourceChangeSource.isHealing &&
        hpChangeToTest.value < mostEffective.value
      )
        continue;
      else if (hpChangeToTest.value > mostEffective.value) continue;
    }

    mostEffective = {
      source: cloneDeep(toJS(hpChangeSource)),
      value: hpChangeToTest.value,
    };
  }

  return mostEffective?.source;
}
