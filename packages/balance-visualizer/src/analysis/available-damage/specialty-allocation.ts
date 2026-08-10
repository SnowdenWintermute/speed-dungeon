import { CombatAttribute, CombatantAttributeRecord } from "@speed-dungeon/common";
import { DAMAGE_CHANNELS, DamageSources } from "../equipment-damage-sources";

export type DamageChannel = (typeof DAMAGE_CHANNELS)[number];

/** The attributes a level-up point can be spent on and a basic attack can feel. Spirit is
 * deliberately absent while this measures attacks only; it joins the list when spell damage does. */
export const DISCRETIONARY_DAMAGE_ATTRIBUTES = [
  CombatAttribute.Strength,
  CombatAttribute.Dexterity,
];

/** Which attribute a gear channel arrives as. Flat damage has none — the game reads it off equipped
 * non-weapons rather than from the attribute record, so it is worn instead of specced. */
export const DAMAGE_CHANNEL_ATTRIBUTES: Partial<Record<DamageChannel, CombatAttribute>> = {
  strength: CombatAttribute.Strength,
  dexterity: CombatAttribute.Dexterity,
  accuracy: CombatAttribute.Accuracy,
};

/** How a character spent each of the two budgets. Kept apart rather than summed into one attribute
 * record, because the whole question the study asks is what gear supplies versus what levelling
 * does: the same total strength means something different when the gear could not have supplied it.
 *
 * Both halves are read out to the table, so a specialty's row shows not just the damage it reached
 * but the shape of the character that reached it. */
export interface SpecialtyAllocation {
  /** Points of each channel bought with the gear budget. */
  fromGear: DamageSources;
  /** Points of each attribute bought with discretionary attribute points. */
  fromDiscretionaryPoints: CombatantAttributeRecord;
}

export function emptyAllocation(): SpecialtyAllocation {
  return {
    fromGear: { strength: 0, dexterity: 0, accuracy: 0, flatDamage: 0 },
    fromDiscretionaryPoints: {},
  };
}

export function copyAllocation(allocation: SpecialtyAllocation): SpecialtyAllocation {
  return {
    fromGear: { ...allocation.fromGear },
    fromDiscretionaryPoints: { ...allocation.fromDiscretionaryPoints },
  };
}
