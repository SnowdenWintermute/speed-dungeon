import { MagicalElement } from "../../combat/magical-elements.js";
import { CombatantProperties } from "../combatant-properties.js";

// @TODO - add in equipment, buffs, and specced trait affinities

export default function getCombatantTotalElementalAffinities(
  combatantProperties: CombatantProperties
): Partial<Record<MagicalElement, number>> {
  return combatantProperties.abilityProperties.getTraitProperties().inherentElementalAffinities;
}
