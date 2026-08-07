import { describe, expect, it } from "vitest";
import { DEEPEST_FLOOR } from "@speed-dungeon/common";
import { DungeonRun, SIMULATED_PARTY_CLASSES } from "../../sim/dungeon-run";
import { AccuracyAvailability } from "../accuracy-availability";

const RUN_COUNT = 3;

function analyzeRuns() {
  const runs = Array.from({ length: RUN_COUNT }, () =>
    DungeonRun.random(SIMULATED_PARTY_CLASSES, DEEPEST_FLOOR).walk()
  );
  return AccuracyAvailability.ofRuns(runs);
}

describe("accuracy available from loot dropped so far", () => {
  it("accumulates down the dungeon and splits into its two sources", () => {
    const rooms = analyzeRuns();

    const [firstRoom] = rooms;
    expect(firstRoom?.fromAllLoot.mean).toBe(0);

    let previousMean = 0;
    for (const room of rooms) {
      expect(room.fromAllLoot.mean).toBeGreaterThanOrEqual(previousMean);
      expect(room.fromAllLoot.mean).toBeCloseTo(
        room.fromAccuracyAffixes.mean + room.fromDexterity.mean
      );
      previousMean = room.fromAllLoot.mean;
    }

    expect(rooms.at(-1)?.fromAllLoot.mean).toBeGreaterThan(0);
  });

  // cloneDeep copies arrow-function class properties by reference, so a snapshot that read
  // getTotalAttributes off the clone reported the end of the run in every room and this was flat
  it("tracks the party's own accuracy rising with level", () => {
    const rooms = analyzeRuns();

    const firstRoomAccuracy = rooms.at(0)?.potential.asPlayed.mean;
    const lastRoomAccuracy = rooms.at(-1)?.potential.asPlayed.mean;

    expect(firstRoomAccuracy).toBeDefined();
    expect(lastRoomAccuracy).toBeGreaterThan(firstRoomAccuracy ?? 0);
  });

  // these two are differences of measured accuracies rather than the dexterity ratio reapplied, so
  // this pins them to the points actually awarded without restating what a point is worth
  it("isolates what allocated points alone buy, and has a support class grant more of them", () => {
    const rooms = analyzeRuns();

    // nothing has levelled in the first room, so there is nothing allocated to credit
    expect(rooms.at(0)?.potential.fromAllocatedPoints.mean).toBe(0);

    const lastRoom = rooms.at(-1);
    expect(lastRoom).toBeDefined();
    const withoutSupport = lastRoom?.potential.fromAllocatedPoints.mean ?? 0;
    const withSupport = lastRoom?.potential.fromAllocatedPointsWithSupportClass.mean ?? 0;

    expect(withoutSupport).toBeGreaterThan(0);
    expect(withSupport).toBeGreaterThan(withoutSupport);
  });
});
