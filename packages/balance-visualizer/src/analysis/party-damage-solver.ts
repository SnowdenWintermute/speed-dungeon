import { Combatant, Equipment, invariant } from "@speed-dungeon/common";
import { ArchetypeProfile, CharacterArchetype } from "./character-archetype";
import { CharacterDamageSolver, SolvedLoadout } from "./character-damage-solver";

export interface PartyMember {
  archetype: CharacterArchetype;
  profile: ArchetypeProfile;
  combatant: Combatant;
}

export interface PartyAssignment {
  byMember: SolvedLoadout[];
  totalDamagePerTurn: number;
}

/** An assignment mid-climb. `held` is the same information as byMember's items, kept alongside it
 * so a move can be proposed without re-deriving who has what on every trial. */
interface SolverState extends PartyAssignment {
  held: Equipment[][];
}

export interface PartySolution extends PartyAssignment {
  /** Where each seed's improvement loop came to rest. */
  totalBySeed: number[];
  /** Best seed minus worst. Zero means every starting point converged on the same total, which is
   * strong evidence contention is not binding and this is the true maximum. Anything above zero is
   * the honest size of what the assignment problem is costing, rather than a caveat about it. */
  totalSpreadAcrossSeeds: number;
}

/** Maximizes total party damage per turn over one shared pool.
 *
 * There is one algorithm here, run from several starting points. The improvement loop lets a single
 * character re-solve exactly over their own items plus everything unclaimed, holding the others
 * fixed. That can only raise the total, since nobody else's damage changes — so it is a hill climb,
 * and where it stops depends entirely on where it started.
 *
 * The seeds are the pick orders: seeding from empty in order (A, B, C) means A solves against the
 * whole pool, B against what A left, and so on. With three members that is six seeds, and running
 * all of them costs little.
 *
 * Two move types alternate inside the loop. A **sweep** lets each member in turn re-solve against
 * what nobody else holds. A **transfer** offers a held item to another member and keeps the swap if
 * the party total rises — one character handing over gear worth more in someone else's hands. The
 * transfer is what splits a pair of items that a single character's own best loadout would take
 * together, which no pick order can do however it runs.
 *
 * Assigning items to characters to maximize a sum is a generalized assignment problem, so nothing
 * tractable proves optimality. totalSpreadAcrossSeeds measures the doubt instead of hiding it. */
export class PartyDamageSolver {
  constructor(
    private readonly characterSolver: CharacterDamageSolver,
    private readonly maxImprovementPasses: number
  ) {}

  solve(members: PartyMember[], target: Combatant, pool: Equipment[]): PartySolution {
    invariant(members.length > 0, "cannot solve equipment for a party of nobody");

    const settled = PartyDamageSolver.pickOrders(members.length).map((pickOrder) =>
      this.improveFrom(members, target, pool, pickOrder)
    );

    const totalBySeed = settled.map((assignment) => assignment.totalDamagePerTurn);
    const best = settled.reduce((winner, assignment) =>
      assignment.totalDamagePerTurn > winner.totalDamagePerTurn ? assignment : winner
    );

    return {
      ...best,
      totalBySeed,
      totalSpreadAcrossSeeds: Math.max(...totalBySeed) - Math.min(...totalBySeed),
    };
  }

  /** Runs the improvement loop to a fixpoint from one starting order, alternating the two move
   * types. Both only ever accept an improvement, so the total climbs monotonically and the first
   * round that fails to move it is the end. */
  private improveFrom(
    members: PartyMember[],
    target: Combatant,
    pool: Equipment[],
    pickOrder: number[]
  ): PartyAssignment {
    let state: SolverState = { held: members.map(() => []), byMember: [], totalDamagePerTurn: 0 };

    for (let pass = 0; pass < this.maxImprovementPasses; pass += 1) {
      const swept = this.sweepMembers(members, target, pool, pickOrder, state.held);
      const better = swept.totalDamagePerTurn > state.totalDamagePerTurn ? swept : state;
      const transferred = this.transferPass(members, target, pool, better);

      if (transferred.totalDamagePerTurn <= state.totalDamagePerTurn) {
        state = better.totalDamagePerTurn > state.totalDamagePerTurn ? better : state;
        break;
      }
      state = transferred;
    }

    invariant(state.byMember.length > 0, "the improvement loop ran no passes");
    return { byMember: state.byMember, totalDamagePerTurn: state.totalDamagePerTurn };
  }

  /** Offers every held item to every other member, one at a time, and keeps the swap when the party
   * total goes up — a character handing over gear that is worth more in someone else's hands.
   *
   * The item is denied to its current holder for the trial rather than merely offered around. Just
   * pooling two members' gear and re-solving them in turn would not do it: whichever solves first
   * takes their own best set, which is how the item ended up concentrated there to begin with.
   * Forbidding it is what forces the split. */
  private transferPass(
    members: PartyMember[],
    target: Combatant,
    pool: Equipment[],
    state: SolverState
  ): SolverState {
    let best = state;

    for (let donor = 0; donor < members.length; donor += 1) {
      for (const item of best.held[donor] ?? []) {
        for (let recipient = 0; recipient < members.length; recipient += 1) {
          if (recipient === donor) {
            continue;
          }

          const trial = this.resolvePair(members, target, pool, best, { donor, recipient, item });
          if (trial.totalDamagePerTurn > best.totalDamagePerTurn) {
            best = trial;
          }
        }
      }
    }

    return best;
  }

  private resolvePair(
    members: PartyMember[],
    target: Combatant,
    pool: Equipment[],
    state: SolverState,
    transfer: { donor: number; recipient: number; item: Equipment }
  ): SolverState {
    const { donor, recipient, item } = transfer;
    const untouched = new Set(
      state.held.flatMap((items, index) => (index === donor || index === recipient ? [] : items))
    );

    const held = state.held.map((items) => [...items]);
    const byMember = [...state.byMember];

    const donorSolved = this.solveMember(members, target, pool, donor, (equipment) => {
      return !untouched.has(equipment) && equipment !== item;
    });
    held[donor] = PartyDamageSolver.itemsOf(donorSolved);
    byMember[donor] = donorSolved;

    const takenByDonor = new Set(held[donor]);
    const recipientSolved = this.solveMember(members, target, pool, recipient, (equipment) => {
      return !untouched.has(equipment) && !takenByDonor.has(equipment);
    });
    held[recipient] = PartyDamageSolver.itemsOf(recipientSolved);
    byMember[recipient] = recipientSolved;

    return {
      held,
      byMember,
      totalDamagePerTurn: byMember.reduce((sum, solved) => sum + solved.damagePerTurn, 0),
    };
  }

  private solveMember(
    members: PartyMember[],
    target: Combatant,
    pool: Equipment[],
    index: number,
    isAvailable: (equipment: Equipment) => boolean
  ) {
    const member = members[index];
    invariant(member !== undefined, "asked to solve a member the party does not have");

    return this.characterSolver.solve(
      member.combatant,
      target,
      pool.filter(isAvailable),
      member.profile
    );
  }

  /** Every member re-solves once, in pick order, each against the pool minus whatever the *other*
   * members are holding. A member always gets their own current items back as candidates, so a pass
   * can never take gear away from someone without giving them the chance to re-earn it. */
  private sweepMembers(
    members: PartyMember[],
    target: Combatant,
    pool: Equipment[],
    pickOrder: number[],
    held: Equipment[][]
  ): SolverState {
    const nextHeld = held.map((items) => [...items]);
    const byMember: SolvedLoadout[] = [];

    for (const index of pickOrder) {
      const claimedByOthers = new Set(
        nextHeld.flatMap((items, other) => (other === index ? [] : items))
      );

      const solved = this.solveMember(
        members,
        target,
        pool,
        index,
        (equipment) => !claimedByOthers.has(equipment)
      );

      nextHeld[index] = PartyDamageSolver.itemsOf(solved);
      byMember[index] = solved;
    }

    return {
      held: nextHeld,
      byMember,
      totalDamagePerTurn: byMember.reduce((sum, solved) => sum + solved.damagePerTurn, 0),
    };
  }

  private static itemsOf(solved: SolvedLoadout): Equipment[] {
    const held = [solved.hands.mainHand, solved.hands.offHand].filter(
      (equipment) => equipment !== null
    );
    return [...held, ...solved.wearables];
  }

  /** Every order, not a rotation of one. Which member picks first is exactly what a single greedy
   * pass gets wrong, and with three members there are only six orders to try. */
  private static pickOrders(memberCount: number): number[][] {
    const permutationsOf = (remaining: number[]): number[][] => {
      if (remaining.length <= 1) {
        return [remaining];
      }
      return remaining.flatMap((index, position) =>
        permutationsOf([
          ...remaining.slice(0, position),
          ...remaining.slice(position + 1),
        ]).map((rest) => [index, ...rest])
      );
    };

    return permutationsOf(Array.from({ length: memberCount }, (_, index) => index));
  }
}
