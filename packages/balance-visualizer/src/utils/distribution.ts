import { invariant } from "@speed-dungeon/common";

/** Plain data rather than a class because these cross the worker boundary, and structured clone
 * strips the prototype off anything carrying methods. */
export interface Distribution {
  mean: number;
  tenthPercentile: number;
  median: number;
  ninetiethPercentile: number;
}

export function distributionOf(samples: number[]): Distribution {
  invariant(samples.length > 0, "cannot describe a distribution with no samples");

  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((total, sample) => total + sample, 0);

  return {
    mean: sum / sorted.length,
    tenthPercentile: valueAtNormalizedRank(sorted, 0.1),
    median: valueAtNormalizedRank(sorted, 0.5),
    ninetiethPercentile: valueAtNormalizedRank(sorted, 0.9),
  };
}

function valueAtNormalizedRank(sorted: number[], normalizedRank: number) {
  const highestIndex = sorted.length - 1;
  const index = Math.min(highestIndex, Math.max(0, Math.ceil(normalizedRank * sorted.length) - 1));
  const value = sorted[index];
  invariant(value !== undefined, "rank index fell outside a non-empty sample set");
  return value;
}
