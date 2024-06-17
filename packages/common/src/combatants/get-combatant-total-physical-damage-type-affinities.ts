import cloneDeep from "lodash.clonedeep";
import { CombatantProperties } from "./combatant-properties";
import { CombatantTraitType } from "./combatant-traits";
import { PhysicalDamageType } from "../combat/hp-change-source-types";

export default function getCombatantTotalPhysicalDamageTypeAffinities(
  combatantProperties: CombatantProperties
): Partial<Record<PhysicalDamageType, number>> {
  const totals = cloneDeep(combatantProperties.inherentPhysicalDamageTypeAffinities);

  for (const combatantTrait of combatantProperties.traits) {
    if (combatantTrait.type === CombatantTraitType.PhysicalDamageTypeResistance) {
      if (!totals[combatantTrait.damageType]) totals[combatantTrait.damageType] = 0;
      totals[combatantTrait.damageType]! += combatantTrait.percent;
    }
  }

  return totals;
}
