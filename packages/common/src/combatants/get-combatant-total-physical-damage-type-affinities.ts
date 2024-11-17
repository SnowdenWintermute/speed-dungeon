import cloneDeep from "lodash.clonedeep";
import { CombatantProperties } from "./combatant-properties.js";
import { CombatantTraitType } from "./combatant-traits.js";
import { PhysicalDamageType } from "../combat/hp-change-source-types.js";

export default function getCombatantTotalPhysicalDamageTypeAffinities(
  combatantProperties: CombatantProperties
): Partial<Record<PhysicalDamageType, number>> {
  const totals = cloneDeep(combatantProperties.inherentPhysicalDamageTypeAffinities);

  for (const combatantTrait of combatantProperties.traits) {
    if (combatantTrait.type === CombatantTraitType.PhysicalDamageTypeResistance) {
      if (totals[combatantTrait.damageType] === undefined)
        totals[combatantTrait.damageType] = combatantTrait.percent;
      else totals[combatantTrait.damageType]! += combatantTrait.percent;
    }
  }

  return totals;
}
