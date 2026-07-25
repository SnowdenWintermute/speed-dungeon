import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { TEST_AUTH_SESSION_ID_PLAYER_1, TEST_AUTH_USERNAME_PLAYER_1 } from "@/fixtures/consts";
import {
  invariant,
  ONE_SECOND,
  PlayerProfileLookupType,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";

// A deleted account reaches us only as the identity provider no longer resolving that id, so the
// ladder falls back to the name we last saw them connect under. Their old runs must keep their name
// on the rows, while the player themselves stops existing as something you can look up.
export async function testDeletedAccountFloorClearReads(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();
  const { client: alpha } = await testFixture.createSingleClientInGameServerGame();

  testFixture.timeMachine.advanceTime(ONE_SECOND);
  await alpha.gameClientHarness.toggleReadyToDescend();

  const { identityProviderQueryStrategy } = testFixture;
  const userIdOption =
    await identityProviderQueryStrategy.findUserIdByUsername(TEST_AUTH_USERNAME_PLAYER_1);
  invariant(userIdOption !== undefined, "expected the player's identity before deletion");

  identityProviderQueryStrategy.deleteIdentity(TEST_AUTH_SESSION_ID_PLAYER_1);

  // the fallback below only means anything if the directory has genuinely forgotten them
  const resolvedAfterDeletion = await identityProviderQueryStrategy.resolveUsernames([
    userIdOption,
  ]);
  expect(resolvedAfterDeletion.size).toBe(0);

  const ladderQueries = await testFixture.createLadderViewerQueries();

  const floor1Page = await ladderQueries.getFloorClearTimes({ floor: 1, page: 0 });
  expect(floor1Page.entries).toHaveLength(1);
  const floor1Entry = floor1Page.entries[0];
  invariant(floor1Entry !== undefined, "expected a floor 1 entry");
  expect(floor1Entry.players).toEqual([TEST_AUTH_USERNAME_PLAYER_1]);

  // their name still labels the run, but they are no longer a player you can visit
  const lookup = await ladderQueries.getPlayerProfile(TEST_AUTH_USERNAME_PLAYER_1);
  expect(lookup.type).toBe(PlayerProfileLookupType.NoSuchPlayer);
}
