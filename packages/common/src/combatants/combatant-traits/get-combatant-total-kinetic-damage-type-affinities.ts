import cloneDeep from "lodash.clonedeep";
import { CombatantTraitType } from "./index.js";
import { KineticDamageType } from "../../combat/kinetic-damage-types.js";
import { CombatantProperties } from "../index.js";

export default function getCombatantTotalKineticDamageTypeAffinities(
  combatantProperties: CombatantProperties
): Partial<Record<KineticDamageType, number>> {
  const totals = cloneDeep(combatantProperties.inherentKineticDamageTypeAffinities);

  for (const combatantTrait of combatantProperties.traits) {
    if (combatantTrait.type === CombatantTraitType.KineticDamageTypeResistance) {
      if (totals[combatantTrait.damageType] === undefined)
        totals[combatantTrait.damageType] = combatantTrait.percent;
      else totals[combatantTrait.damageType]! += combatantTrait.percent;
    }
  }

  return totals;
}
