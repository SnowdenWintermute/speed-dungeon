import { Combatant, getCombatantTotalAttributes } from "@speed-dungeon/common";

/** Holds a combatant's total attributes still while something reads them repeatedly.
 *
 * One damage calculation asks for total attributes around 69 times, and each ask rebuilds them from
 * equipment, affixes, conditions and the derived pass. An analysis that evaluates a combatant
 * thousands of times therefore spends nearly all of its time recomputing an answer that cannot have
 * changed. Measured at 88% of the available-damage study before this existed.
 *
 * The override is installed on the instance, shadowing the prototype method, so only the combatant
 * handed to this is affected — nothing in the game caches attributes, which is deliberate, since
 * there the answer really does change under you.
 *
 * **Only for a combatant the caller owns and is not sharing.** Refresh after every change, or reads
 * will keep answering with the state before it. */
export class CombatantAttributeCache {
  constructor(private readonly combatant: Combatant) {}

  refresh() {
    const { combatantProperties } = this.combatant;
    // the free function, not the method being replaced, so this does not read its own cache
    const totalAttributes = getCombatantTotalAttributes(combatantProperties);
    combatantProperties.attributeProperties.getTotalAttributes = () => totalAttributes;
  }
}
