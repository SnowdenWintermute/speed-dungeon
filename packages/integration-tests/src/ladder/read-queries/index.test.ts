import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { PostgresTestDatabase } from "@/fixtures/postgres-test-database";
import { IdGeneratorRandom } from "@speed-dungeon/common";
import { testIronmanFloorClearReads } from "./ironman-floor-clear-reads";
import { testRankedRaceWinRateReads } from "./ranked-race-win-rate-reads";
import { testRankedRaceSoloLeaveRecordsLoss } from "./ranked-race-solo-leave-loss-reads";
import { testIronmanReadQueryFiltersAndSnapshot } from "./ironman-filters-and-snapshot-reads";
import { testFloorClearPagination } from "./floor-clear-pagination-reads";
import { testIronmanMultiRunPersonalBest } from "./ironman-multi-run-personal-best-reads";

const CONTAINER_STARTUP_TIMEOUT_MS = 120_000;

const strategies = [{ name: "in-memory", usePostgres: false }];
if (process.env.RUN_POSTGRES_LADDER_TESTS === "1") {
  strategies.push({ name: "postgres", usePostgres: true });
}

describe.each(strategies)("ladder read queries ($name)", ({ usePostgres }) => {
  const postgres = usePostgres ? new PostgresTestDatabase() : null;
  const testFixture = new IntegrationTestFixture(
    postgres === null
      ? undefined
      : {
          ladderPersistenceStrategyFactory: () => postgres.createLadderPersistenceStrategy(),
          idGeneratorFactory: () => new IdGeneratorRandom({ saveHistory: false }),
        }
  );

  beforeAll(async () => {
    if (postgres !== null) {
      // Testcontainers' startup/wait strategy is timer-driven, so it deadlocks under fake timers a
      // prior test may have left installed
      testFixture.timeMachine.returnToPresent();
      await postgres.start();
    }
  }, CONTAINER_STARTUP_TIMEOUT_MS);

  afterEach(async () => {
    await testFixture.closeAllServers();
    if (postgres !== null) {
      testFixture.timeMachine.returnToPresent();
      await postgres.truncateAllLadderTables();
    }
  });

  afterAll(async () => {
    if (postgres !== null) {
      testFixture.timeMachine.returnToPresent();
      await postgres.stop();
    }
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

  it("paginates floor clears across a page boundary", async () => {
    await testFloorClearPagination(testFixture);
  });

  it("keeps the fastest floor clear across multiple runs in a player's personal bests", async () => {
    await testIronmanMultiRunPersonalBest(testFixture);
  });
});
