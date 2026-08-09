import { Equipment } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";

/** A copy of the item that anyone can wear.
 *
 * Requirements are an *output* of this study, not an input to it. The values on the templates today
 * are speculative, so solving against them would calibrate the measurement to numbers we invented
 * and then read the result back as if it meant something. Stripping them measures what each
 * archetype reaches when only item damage and affix values constrain it, which is the ceiling
 * requirements are later chosen to pull down from:
 *
 *     cost of a requirement = unconstrained best damage − best damage with the gate paid
 *
 * That subtraction is unavailable without the unconstrained figure, so this has to come first.
 *
 * Cleared on the item rather than ignored inside the solver so everything downstream keeps policing
 * legality through real game code — getCombatantTotalAttributes still strips unmet items and
 * getWeaponsInSlots still drops unusable weapons, they simply never fire. A solver flag would
 * create a second notion of "wearable" that could drift from the game's.
 *
 * One real consequence while requirements are absent: attribute allocation only ever buys damage,
 * never a gate, so a bow user's split is trivially all Dexterity. That is the baseline a gate's
 * cost gets measured against rather than a distortion of it. */
export function withoutRequirements(equipment: Equipment): Equipment {
  const unrestricted = cloneDeep(equipment);
  unrestricted.requirements = {};
  return unrestricted;
}
