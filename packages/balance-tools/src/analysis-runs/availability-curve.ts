import { ArrayUtils, NormalizedPercentage, invariant } from "@speed-dungeon/common";
import { AvailabilityPoint } from "./room-availability.ts";

/**
 * Where a percentile falls on a drop curve, as the two rooms straddling it. A threshold almost never
 * lands on a room, and a build's attributes move in level sized steps, so reading only the room that
 * crossed it rounds every answer up to the next step.
 */
export interface AvailabilityAnchor {
  /** null when the threshold is met in the first room the item ever dropped in */
  earlier: AvailabilityPoint | null;
  later: AvailabilityPoint;
  /** how much of `later` to read; 0 sits on `earlier`, 1 on `later` */
  weightOfLater: NormalizedPercentage;
}

export class AvailabilityCurve {
  /**
   * A running maximum rather than the points as measured. Availability only climbs within a run, but
   * each room divides by the runs that reached it, so a room only some runs report can read lower
   * than the room before it. Straddling one of those dips would weight it negatively.
   */
  private readonly points: AvailabilityPoint[];

  constructor(
    measured: AvailabilityPoint[],
    private subject: string
  ) {
    invariant(measured.length > 0, `the run set reached no rooms, so ${subject} has no drop curve`);

    let highest = 0;
    this.points = measured.map((point) => {
      highest = Math.max(highest, point.percentOfRuns);
      return { ...point, percentOfRuns: highest };
    });

    invariant(
      this.ceiling > 0,
      `${subject} never dropped in any run, so there is no room to read a build from`
    );
  }

  /** the most the curve ever reaches, which is its last point once the dips are climbed over */
  get ceiling(): NormalizedPercentage {
    return ArrayUtils.getExpectedAtIndex(this.points, this.points.length - 1).percentOfRuns;
  }

  /**
   * Measured against the ceiling rather than against 100%, so an item too rare to ever be likely
   * still anchors somewhere sensible.
   */
  selectAnchor(percentile: NormalizedPercentage): AvailabilityAnchor {
    const threshold = this.ceiling * percentile;

    // the > 0 is what makes a percentile of 0 mean the first room it ever dropped in, not room one
    const laterIndex = this.points.findIndex(
      (point) => point.percentOfRuns > 0 && point.percentOfRuns >= threshold
    );
    invariant(
      laterIndex !== -1,
      `${this.subject} reached no room at or above ${threshold} of its runs`
    );

    const later = ArrayUtils.getExpectedAtIndex(this.points, laterIndex);
    const earlier =
      laterIndex === 0 ? null : ArrayUtils.getExpectedAtIndex(this.points, laterIndex - 1);

    // a room the item could not yet have dropped in holds no build worth blending toward
    if (earlier === null || earlier.percentOfRuns === 0) {
      return { earlier: null, later, weightOfLater: 1 };
    }

    // the curve only climbs and `later` is the first point to reach the threshold, so `earlier` sits
    // strictly below it and this span cannot be zero
    const span = later.percentOfRuns - earlier.percentOfRuns;

    return { earlier, later, weightOfLater: (threshold - earlier.percentOfRuns) / span };
  }
}
