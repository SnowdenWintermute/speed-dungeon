import cloneDeep from "lodash.clonedeep";
import { MagicalElement } from "../../combat/magical-elements.js";
import { CombatantProperties } from "../index.js";

// @TODO - add in equipment, buffs, and specced trait affinities

export default function getCombatantTotalElementalAffinities(
  combatantProperties: CombatantProperties
): Partial<Record<MagicalElement, number>> {
  return cloneDeep(
    combatantProperties.abilityProperties.traitProperties.inherentElementalAffinities
  );
}
