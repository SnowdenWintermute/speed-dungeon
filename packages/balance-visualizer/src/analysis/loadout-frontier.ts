import { Equipment } from "@speed-dungeon/common";
import {
  DamageSources,
  EquipmentDamageSources,
  NO_DAMAGE_SOURCES,
} from "./equipment-damage-sources";
import {
  AttributeRequirement,
  DominanceProfile,
  mergeRequirements,
  pruneDominated,
} from "./pareto-prune";

/** A set of wearables chosen so far, reduced to the only two things that decide whether it can still
 * win: what it gives, and what it demands. */
export interface PartialLoadout {
  /** Summed across the items — every item reaches damage per turn only by adding to these. */
  contribution: DamageSources;
  /** Maxed across the items, not summed: wearing two items that each want 15 Strength still wants
   * 15, so requirements compose by maximum while contributions compose by sum. */
  requirement: AttributeRequirement;
  items: Equipment[];
}

/** The reason the search is not 10^20 combinations.
 *
 * Damage per turn depends on an item only through four running totals — Strength, Dexterity,
 * Accuracy, flat damage — and it is weakly increasing in every one of them. So a partial loadout
 * beaten on all four while demanding no less can be discarded, and so can every completion of it,
 * unevaluated. See pruneDominated for why that is lossless.
 *
 * Pruning between slots rather than at the end is what keeps the intermediate set from exploding:
 * the frontier collapses back to the handful of genuinely different trade-offs before the next slot
 * multiplies it again. */
export class LoadoutFrontier {
  private states: PartialLoadout[] = [
    { contribution: NO_DAMAGE_SOURCES, requirement: {}, items: [] },
  ];

  /** One call per equipment type, with the number of slots that type can occupy — rings pass 2,
   * everything else 1. The count is explicit because both ring slots draw from one pool, so filling
   * them is not the same as calling this twice: a loadout must not wear the same ring twice. */
  fillSlots(candidates: Equipment[], slotCount: number) {
    for (let slot = 0; slot < slotCount; slot += 1) {
      this.fillOneSlot(candidates);
    }
    return this;
  }

  getStates(): PartialLoadout[] {
    return this.states;
  }

  static dominanceProfileOf(loadout: PartialLoadout): DominanceProfile {
    const { strength, dexterity, accuracy, flatDamage } = loadout.contribution;
    return { benefits: [strength, dexterity, accuracy, flatDamage], demands: loadout.requirement };
  }

  private fillOneSlot(candidates: Equipment[]) {
    const extended: PartialLoadout[] = [];

    for (const state of this.states) {
      // leaving the slot empty is always an option, and is what makes a shorter loadout reachable
      extended.push(state);

      for (const candidate of candidates) {
        if (state.items.includes(candidate)) {
          continue;
        }
        extended.push(LoadoutFrontier.extend(state, candidate));
      }
    }

    this.states = pruneDominated(extended, LoadoutFrontier.dominanceProfileOf);
  }

  private static extend(state: PartialLoadout, candidate: Equipment): PartialLoadout {
    return {
      contribution: EquipmentDamageSources.sum([
        state.contribution,
        EquipmentDamageSources.of(candidate),
      ]),
      requirement: mergeRequirements(state.requirement, candidate.requirements),
      items: [...state.items, candidate],
    };
  }
}
