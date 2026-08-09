import { CombatAttribute, iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";

export type AttributeRequirement = Partial<Record<CombatAttribute, number>>;

/** What a thing gives and what it costs, reduced to the form dominance needs. */
export interface DominanceProfile {
  /** Every entry is an axis damage per turn is weakly increasing in. Order is positional, so the
   * same profile function has to be used across everything being compared. */
  benefits: number[];
  /** Attribute minimums that must be met before the benefits arrive. Lower is better: two items
   * that give the same but demand different amounts are not interchangeable, because meeting the
   * larger demand costs allocation points that would otherwise buy damage. */
  demands: AttributeRequirement;
}

/** Discards anything that cannot win. A is kept over B when A gives at least as much on every
 * benefit axis and demands no more on every attribute — then whatever B would be combined with, A
 * combined the same way scores at least as high, because the objective is monotone in the benefits.
 *
 * Lossless rather than heuristic, and it needs no knowledge of the damage formula beyond that
 * monotonicity, so nothing here has to be kept in step with the real pipeline. Ties count as
 * dominated so duplicates collapse to one survivor. */
export function pruneDominated<TItem>(
  items: TItem[],
  profileOf: (item: TItem) => DominanceProfile
): TItem[] {
  const profiled = items.map((item) => ({ item, profile: profileOf(item) }));
  const kept: typeof profiled = [];

  for (const candidate of profiled) {
    if (kept.some((survivor) => covers(survivor.profile, candidate.profile))) {
      continue;
    }
    // the candidate survived, so anything it covers is now redundant
    const stillStanding = kept.filter((survivor) => !covers(candidate.profile, survivor.profile));
    kept.length = 0;
    kept.push(...stillStanding, candidate);
  }

  return kept.map(({ item }) => item);
}

function covers(a: DominanceProfile, b: DominanceProfile) {
  for (let axis = 0; axis < a.benefits.length; axis += 1) {
    if ((a.benefits[axis] ?? 0) < (b.benefits[axis] ?? 0)) {
      return false;
    }
  }

  for (const [attribute, demanded] of iterateNumericEnumKeyedRecord(a.demands)) {
    if (demanded > (b.demands[attribute] ?? 0)) {
      return false;
    }
  }

  return true;
}

export function mergeRequirements(
  accumulated: AttributeRequirement,
  incoming: AttributeRequirement
): AttributeRequirement {
  const merged: AttributeRequirement = { ...accumulated };

  for (const [attribute, value] of iterateNumericEnumKeyedRecord(incoming)) {
    merged[attribute] = Math.max(merged[attribute] ?? 0, value);
  }

  return merged;
}
