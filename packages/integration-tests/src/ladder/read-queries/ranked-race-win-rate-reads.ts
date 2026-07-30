import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE,
  GAME_CONFIG,
  GameMode,
  invariant,
  ONE_SECOND,
  PartyFateType,
  PlayerProfileLookupType,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";
import { requireGameRecordAggregate, requirePartyOfCharacter } from "./aggregate-lookup";
import { TEST_AUTH_USERNAME_PLAYER_1, TEST_AUTH_USERNAME_PLAYER_2 } from "@/fixtures/consts";

// Drives a real two-party ranked-race game where both parties escape, the first one earlier than the
// second, then asserts the win-rate and floor-clear READ queries against the records the race write
// path (RankedRaceModeLadderPolicy) actually produced. This is the race counterpart to the Ironman
// read test: it exercises the parts of the projection that only race data can — earliest-escape
// winner resolution and a win/loss split across two participants. The escape ordering is made
// deterministic by advancing the (faked) clock between the two escapes, since the winner is decided
// by the escape's Date.now() timestamp.
export async function testRankedRaceWinRateReads(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();

  const { alpha, bravo, alphaCharacterName, bravoCharacterName } =
    await testFixture.createTwoClientsInGameServerGame({
      auth: true,
      mode: GameMode.RankedRace,
      separateParties: true,
    });
  const gameId = alpha.clientApplication.gameContext.requireGame().id;

  // one descent off floor 1 reaches the escape floor and records a floor-1 clear on the way. alpha
  // escapes first; advancing the clock guarantees bravo's escape timestamp is strictly later, so
  // alpha is the unambiguous earliest-escape winner.
  GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE = 2;
  try {
    await alpha.gameClientHarness.toggleReadyToDescend();
    testFixture.timeMachine.advanceTime(ONE_SECOND);
    await bravo.gameClientHarness.toggleReadyToDescend();

    // ground truth from the write path
    const aggregate = await requireGameRecordAggregate(testFixture, gameId);
    expect(aggregate.game.mode).toBe(GameMode.RankedRace);
    const alphaParty = requirePartyOfCharacter(aggregate, alphaCharacterName);
    const bravoParty = requirePartyOfCharacter(aggregate, bravoCharacterName);

    // both parties escaped, alpha before bravo
    invariant(
      alphaParty.party.fateOption !== undefined && bravoParty.party.fateOption !== undefined,
      "expected both parties to have a recorded fate"
    );
    expect(alphaParty.party.fateOption.type).toBe(PartyFateType.Escape);
    expect(bravoParty.party.fateOption.type).toBe(PartyFateType.Escape);
    expect(alphaParty.party.fateOption.timestamp).toBeLessThan(
      bravoParty.party.fateOption.timestamp
    );

    const ladderQueries = await testFixture.createLadderViewerQueries();

    // --- getWinRateLadder: alpha (earliest escape) is the winner, bravo the loser ---
    const winRatePage = await ladderQueries.getWinRateLadder({
      page: 0,
      minimumGamesPlayed: 1,
    });
    const byUsername = new Map(winRatePage.entries.map((entry) => [entry.username, entry]));
    const alphaEntry = byUsername.get(TEST_AUTH_USERNAME_PLAYER_1);
    const bravoEntry = byUsername.get(TEST_AUTH_USERNAME_PLAYER_2);
    invariant(
      alphaEntry !== undefined && bravoEntry !== undefined,
      "expected both participants on the win-rate ladder"
    );
    expect(alphaEntry.record).toEqual({ wins: 1, losses: 0, gamesPlayed: 1, winRate: 1 });
    expect(bravoEntry.record).toEqual({ wins: 0, losses: 1, gamesPlayed: 1, winRate: 0 });
    // winner ranks above the loser
    expect(alphaEntry.rank).toBeLessThan(bravoEntry.rank);

    // --- player profiles reflect the same win/loss split ---
    const alphaLookup = await ladderQueries.getPlayerProfile(TEST_AUTH_USERNAME_PLAYER_1);
    const bravoLookup = await ladderQueries.getPlayerProfile(TEST_AUTH_USERNAME_PLAYER_2);
    invariant(
      alphaLookup.type === PlayerProfileLookupType.Found &&
        bravoLookup.type === PlayerProfileLookupType.Found,
      "expected to find both players"
    );
    expect(alphaLookup.profile.rankedRaceRecord).toEqual({
      wins: 1,
      losses: 0,
      gamesPlayed: 1,
      winRate: 1,
    });
    expect(bravoLookup.profile.rankedRaceRecord).toEqual({
      wins: 0,
      losses: 1,
      gamesPlayed: 1,
      winRate: 0,
    });

    // --- getFloorClearTimes(floor 1): both parties recorded a race floor-1 clear ---
    const floor1Page = await ladderQueries.getFloorClearTimes({
      floor: 1,
      page: 0,
    });
    expect(floor1Page.entries).toHaveLength(2);
    expect(floor1Page.entries.every((entry) => entry.mode === GameMode.RankedRace)).toBe(true);
    const clearedPartyIds = new Set(floor1Page.entries.map((entry) => entry.partyRecordId));
    expect(clearedPartyIds.has(alphaParty.party.id)).toBe(true);
    expect(clearedPartyIds.has(bravoParty.party.id)).toBe(true);
    // sorted fastest-first
    invariant(
      floor1Page.entries[0] !== undefined && floor1Page.entries[1] !== undefined,
      "expected two floor-1 entries"
    );
    expect(floor1Page.entries[0].timeSpentOnFloor).toBeLessThanOrEqual(
      floor1Page.entries[1].timeSpentOnFloor
    );
  } finally {
    GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE = DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE;
  }
}
