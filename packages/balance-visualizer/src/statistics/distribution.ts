import { ArrayUtils, invariant } from "@speed-dungeon/common";

const DECILE_FRACTION = 0.1;

export class Distribution {
  private constructor(
    readonly mean: number,
    /** the average of the lowest decile, not the value sitting at the tenth percentile */
    readonly tenthPercentileAverage: number,
    readonly median: number,
    readonly ninetiethPercentileAverage: number
  ) {}

  static of(samples: number[]) {
    invariant(samples.length > 0, "can't describe an empty sample set");
    const sorted = [...samples].sort((a, b) => a - b);

    // at small sample counts a decile rounds to nothing, so keep at least the single extreme
    const decileSize = Math.max(1, Math.round(sorted.length * DECILE_FRACTION));
    const middle = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 === 0
        ? ArrayUtils.average([
            ArrayUtils.getExpectedAtIndex(sorted, middle - 1),
            ArrayUtils.getExpectedAtIndex(sorted, middle),
          ])
        : ArrayUtils.getExpectedAtIndex(sorted, middle);

    return new Distribution(
      ArrayUtils.average(sorted),
      ArrayUtils.average(sorted.slice(0, decileSize)),
      median,
      ArrayUtils.average(sorted.slice(sorted.length - decileSize))
    );
  }
}
