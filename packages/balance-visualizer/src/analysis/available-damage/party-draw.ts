import { invariant } from "@speed-dungeon/common";
import {
  ArchetypeProfile,
  CHARACTER_ARCHETYPES,
  CharacterArchetype,
  DEFAULT_ARCHETYPE_PROFILES,
} from "../character-archetype";
import { SPECIALTY_COMBOS, SpecialtyCombo, supportClassOptions } from "./specialty-combo";

export interface DrawnMember {
  combo: SpecialtyCombo;
  profile: ArchetypeProfile;
}

export enum PartyDrawMode {
  /** Every combo gets the same number of seats over a long enough run of walks. */
  EvenlyDistributed,
  /** One seat is always the chosen combo; the rest fill in around it. */
  GuaranteeCombo,
}

export type PartyDrawSettings =
  | { type: PartyDrawMode.EvenlyDistributed }
  | { type: PartyDrawMode.GuaranteeCombo; combo: SpecialtyCombo };

/** Archetypes are drawn without replacement in both modes, so no two characters in a party ever
 * specialize in the same weapon. That matters because the measured character is assumed to get first
 * pick of their weapon type — two bow users in one party would both be handed the same best bow. */
export class ArchetypeParty {
  /** What is left of the current cycle. Every combo is seated exactly once per cycle, so coverage is
   * even by construction rather than even in expectation — the table reports each combo separately,
   * and sampling would leave some of them reading as noise for want of runs.
   *
   * A cursor over the combo list does not work: the list is grouped by archetype, and a party
   * already holding that archetype skips the whole block, so the cursor lands on the first combo of
   * the next block every time and most combos are never reached. */
  private pending: SpecialtyCombo[] = [];

  constructor(
    private readonly roll: () => number,
    /** Where this drawer starts in the combo list. Workers each run their own cycle, so without an
     * offset they would all re-walk the beginning of it and cover the same few combos rather than
     * splitting the work. */
    private readonly comboCycleOffset: number = 0
  ) {}

  draw(size: number, settings: PartyDrawSettings): DrawnMember[] {
    invariant(
      size <= CHARACTER_ARCHETYPES.length,
      "cannot draw more archetypes than exist without repeating one"
    );

    const drawn: DrawnMember[] = [];
    const remaining = new Set(CHARACTER_ARCHETYPES);

    if (settings.type === PartyDrawMode.GuaranteeCombo) {
      drawn.push(ArchetypeParty.memberOf(settings.combo));
      remaining.delete(settings.combo.archetype);
    }

    while (drawn.length < size) {
      const combo =
        settings.type === PartyDrawMode.EvenlyDistributed
          ? this.nextCombo(remaining)
          : this.randomCombo(remaining);

      drawn.push(ArchetypeParty.memberOf(combo));
      remaining.delete(combo.archetype);
    }

    return drawn;
  }

  /** Takes a combo still owed a seat this cycle, from whichever eligible archetype has the most left
   * to place.
   *
   * Taking the earliest instead starves the tail: a party needs three distinct archetypes, so a
   * cycle that has spent its large archetypes early is left with combos of one archetype and cannot
   * fill a party. It then starts the next cycle with those still pending, and because the order is
   * fixed the same few combos land at the seam every time and are never seated. Draining the largest
   * first keeps the remainder spread across archetypes, so a cycle finishes with combos that can
   * still be dealt into parties. */
  private nextCombo(remaining: Set<CharacterArchetype>) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const pendingPerArchetype = new Map<CharacterArchetype, number>();
      for (const combo of this.pending) {
        if (remaining.has(combo.archetype)) {
          pendingPerArchetype.set(
            combo.archetype,
            (pendingPerArchetype.get(combo.archetype) ?? 0) + 1
          );
        }
      }

      const fullest = [...pendingPerArchetype.entries()].sort(([, a], [, b]) => b - a)[0];
      if (fullest !== undefined) {
        const [archetype] = fullest;
        const index = this.pending.findIndex((combo) => combo.archetype === archetype);
        const [combo] = this.pending.splice(index, 1);
        invariant(combo !== undefined, "an archetype counted as pending had no combo left");
        return combo;
      }

      this.pending = ArchetypeParty.cycleFrom(this.comboCycleOffset);
    }

    throw new Error("no combo exists for an archetype the party has not filled");
  }

  /** Filling the seats around a guaranteed combo. The classes are rolled rather than cycled: these
   * characters are only there to compete for loot, and nothing is recorded about them. */
  private randomCombo(remaining: Set<CharacterArchetype>): SpecialtyCombo {
    const archetypes = [...remaining];
    const archetype = archetypes[Math.floor(this.roll() * archetypes.length)];
    invariant(archetype !== undefined, "drew from an empty archetype pool");

    const { allowedClasses } = DEFAULT_ARCHETYPE_PROFILES[archetype];
    const mainClass = allowedClasses[Math.floor(this.roll() * allowedClasses.length)];
    invariant(mainClass !== undefined, "an archetype allows no classes");

    const supports = supportClassOptions(mainClass);
    const supportClass = supports[Math.floor(this.roll() * supports.length)];
    invariant(supportClass !== undefined, "a class has no support class options");

    return { archetype, mainClass, supportClass };
  }

  private static cycleFrom(offset: number) {
    const start = ((offset % SPECIALTY_COMBOS.length) + SPECIALTY_COMBOS.length) % SPECIALTY_COMBOS.length;
    return [...SPECIALTY_COMBOS.slice(start), ...SPECIALTY_COMBOS.slice(0, start)];
  }

  private static memberOf(combo: SpecialtyCombo): DrawnMember {
    return { combo, profile: DEFAULT_ARCHETYPE_PROFILES[combo.archetype] };
  }
}
