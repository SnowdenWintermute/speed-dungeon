import { RandomNumberGenerator } from "../utility-classes/randomizers.js";
import { ArrayUtils } from "../utils/array-utils.js";
import { throwIfLoopLimitReached } from "../utils/index.js";

export interface BudgetDrawParams {
  budget: number;
  stopFraction: number;
  overflowFraction: number;
  withReplacement: boolean;
}

export function drawWithinBudget<T>(
  candidates: readonly T[],
  getWeight: (candidate: T) => number,
  getCost: (candidate: T) => number,
  params: BudgetDrawParams,
  rng: RandomNumberGenerator
): T[] {
  const { budget, stopFraction, overflowFraction, withReplacement } = params;
  const stopAt = budget * stopFraction;
  const overflowAt = budget * overflowFraction;

  const selected: T[] = [];
  const pool = [...candidates];
  let filled = 0;
  let safetyCounter = 0;

  while (filled < stopAt) {
    throwIfLoopLimitReached(safetyCounter, "drawWithinBudget");
    safetyCounter += 1;

    const eligible = pool.filter((candidate) => filled + getCost(candidate) <= overflowAt);
    if (eligible.length === 0) {
      break;
    }

    const weighted = eligible.map((candidate) => ({ candidate, weight: getWeight(candidate) }));
    const chosen = ArrayUtils.chooseWeighted(weighted, rng);
    if (chosen === undefined) {
      break;
    }

    selected.push(chosen.candidate);
    filled += getCost(chosen.candidate);

    if (!withReplacement) {
      ArrayUtils.removeElement(pool, chosen.candidate);
    }
  }

  return selected;
}
