import { KineticDamageType } from "../../combat/kinetic-damage-types.js";
import { CombatantProperties } from "../combatant-properties.js";

// @TODO - add in equipment, buffs, and specced trait affinities

export default function getCombatantTotalKineticDamageTypeAffinities(
  combatantProperties: CombatantProperties
): Partial<Record<KineticDamageType, number>> {
  return combatantProperties.abilityProperties.getTraitProperties()
    .inherentKineticDamageTypeAffinities;
}
