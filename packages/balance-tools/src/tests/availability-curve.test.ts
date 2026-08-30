import { NormalizedPercentage } from "@speed-dungeon/common";
import { AvailabilityCurve } from "../analysis-runs/availability-curve.ts";
import { AvailabilityPoint } from "../analysis-runs/room-availability.ts";

const SUBJECT = "Body Armor Chain Mail";

/** one floor's worth of rooms, so a point is identified by its position in the list */
function curveOf(percentages: NormalizedPercentage[]) {
  const points: AvailabilityPoint[] = percentages.map((percentOfRuns, index) => ({
    floor: 1,
    room: index + 1,
    percentOfRuns,
  }));

  return new AvailabilityCurve(points, SUBJECT);
}

it("anchors a percentile of 0 on the first room the item ever dropped in, with nothing to blend", () => {
  const anchor = curveOf([0, 0, 0.08, 0.1, 0.6]).selectAnchor(0);

  expect(anchor.later.room).toBe(3);
  expect(anchor.earlier).toBe(null);
  expect(anchor.weightOfLater).toBe(1);
});

it("does not blend toward a room the item could not have dropped in yet", () => {
  // the threshold of 0.06 is met in room 3, but room 2 is a room where it never dropped
  const anchor = curveOf([0, 0, 0.08, 0.1, 0.6]).selectAnchor(0.1);

  expect(anchor.later.room).toBe(3);
  expect(anchor.earlier).toBe(null);
});

it("anchors a percentile of 1 wholly on the room the curve stops climbing in", () => {
  const anchor = curveOf([0, 0.08, 0.1, 0.6, 0.62]).selectAnchor(1);

  expect(anchor.later.room).toBe(5);
  expect(anchor.earlier?.room).toBe(4);
  expect(anchor.weightOfLater).toBeCloseTo(1);
});

it("places a percentile falling between two rooms partway between them", () => {
  const curve = curveOf([0, 0.08, 0.1, 0.6, 0.62]);
  const anchor = curve.selectAnchor(0.33);

  // ceiling 0.62, so the threshold is 0.2046, which sits within the 0.1 to 0.6 jump
  expect(curve.ceiling).toBeCloseTo(0.62);
  expect(anchor.earlier?.room).toBe(3);
  expect(anchor.later.room).toBe(4);
  expect(anchor.weightOfLater).toBeCloseTo((0.62 * 0.33 - 0.1) / 0.5);
});

it("climbs over a dip rather than weighting it negatively", () => {
  // room 4 reads lower than room 3 because fewer runs reached it, not because the item un-dropped
  const anchor = curveOf([0, 0.3, 0.5, 0.4, 0.8]).selectAnchor(0.75);

  expect(anchor.earlier?.room).toBe(4);
  expect(anchor.later.room).toBe(5);
  // the dip is read as 0.5, the running maximum, so the span is 0.8 - 0.5
  expect(anchor.weightOfLater).toBeCloseTo((0.8 * 0.75 - 0.5) / 0.3);
});

it("does not divide by zero when the threshold falls on a run of equal rooms", () => {
  const anchor = curveOf([0, 0.2, 0.5, 0.5, 0.5]).selectAnchor(1);

  // the first room to reach the ceiling wins, so the room before it always sits strictly below
  expect(anchor.earlier?.room).toBe(2);
  expect(anchor.later.room).toBe(3);
  expect(anchor.weightOfLater).toBeCloseTo(1);
});

it("refuses a curve for an item that never dropped", () => {
  expect(() => curveOf([0, 0, 0])).toThrow(SUBJECT);
});

it("refuses a run set that reached no rooms", () => {
  expect(() => curveOf([])).toThrow(SUBJECT);
});
