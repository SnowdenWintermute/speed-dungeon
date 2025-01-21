import cloneDeep from "lodash.clonedeep";
import { CombatantTraitType } from "./index.js";
import { MagicalElement } from "../../combat/magical-elements.js";
import { CombatantProperties } from "../index.js";

export default function getCombatantTotalElementalAffinities(
  combatantProperties: CombatantProperties
): Partial<Record<MagicalElement, number>> {
  const totals = cloneDeep(combatantProperties.inherentElementalAffinities);

  for (const combatantTrait of combatantProperties.traits) {
    if (combatantTrait.type === CombatantTraitType.ElementalAffinity) {
      if (!totals[combatantTrait.element]) totals[combatantTrait.element] = 0;
      totals[combatantTrait.element]! += combatantTrait.percent;
    }
  }

  return totals;
}
