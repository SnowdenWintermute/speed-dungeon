import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testIronmanFloorClearReads } from "./ironman-floor-clear-reads";
import { testRankedRaceWinRateReads } from "./ranked-race-win-rate-reads";
import { testRankedRaceSoloLeaveRecordsLoss } from "./ranked-race-solo-leave-loss-reads";
import { testIronmanReadQueryFiltersAndSnapshot } from "./ironman-filters-and-snapshot-reads";

describe("ladder read queries", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("reads floor-clear times and player profile from a played Ironman run", async () => {
    await testIronmanFloorClearReads(testFixture);
  });

  it("reads win rate and floor clears from a played two-party ranked race", async () => {
    await testRankedRaceWinRateReads(testFixture);
  });

  it("records a ranked race loss when a solo player leaves and their party is detached", async () => {
    await testRankedRaceSoloLeaveRecordsLoss(testFixture);
  });

  it("filters floor clears by mode and control scheme and hydrates a character snapshot", async () => {
    await testIronmanReadQueryFiltersAndSnapshot(testFixture);
  });
});
