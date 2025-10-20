import cloneDeep from "lodash.clonedeep";
import { KineticDamageType } from "../../combat/kinetic-damage-types.js";
import { CombatantProperties } from "../combatant-properties.js";

// @TODO - add in equipment, buffs, and specced trait affinities

export default function getCombatantTotalKineticDamageTypeAffinities(
  combatantProperties: CombatantProperties
): Partial<Record<KineticDamageType, number>> {
  return cloneDeep(
    combatantProperties.abilityProperties.getTraitProperties().inherentKineticDamageTypeAffinities
  );
}
