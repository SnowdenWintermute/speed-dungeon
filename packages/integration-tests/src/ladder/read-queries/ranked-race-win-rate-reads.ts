import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE,
  GAME_CONFIG,
  GameMode,
  invariant,
  ONE_SECOND,
  PartyFateType,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";
import { requireOwnerId, requirePartyOfCharacter } from "./aggregate-lookup";

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
    const aggregate = await testFixture.ladderGameRecordsService.requireGameRecordAggregate(gameId);
    expect(aggregate.game.mode).toBe(GameMode.RankedRace);
    const alphaParty = requirePartyOfCharacter(aggregate, alphaCharacterName);
    const bravoParty = requirePartyOfCharacter(aggregate, bravoCharacterName);
    const alphaId = requireOwnerId(alphaParty, alphaCharacterName);
    const bravoId = requireOwnerId(bravoParty, bravoCharacterName);

    // both parties escaped, alpha before bravo
    invariant(
      alphaParty.party.fateOption !== undefined && bravoParty.party.fateOption !== undefined,
      "expected both parties to have a recorded fate"
    );
    expect(alphaParty.party.fateOption.type).toBe(PartyFateType.Escape);
    expect(bravoParty.party.fateOption.type).toBe(PartyFateType.Escape);
    expect(alphaParty.party.fateOption.timestamp).toBeLessThan(bravoParty.party.fateOption.timestamp);

    // --- getWinRateLadder: alpha (earliest escape) is the winner, bravo the loser ---
    const winRatePage = await testFixture.ladderGameRecordsService.getWinRateLadder({
      page: 0,
      minimumGamesPlayed: 1,
    });
    const byId = new Map(winRatePage.entries.map((entry) => [entry.participantId, entry]));
    const alphaEntry = byId.get(alphaId);
    const bravoEntry = byId.get(bravoId);
    invariant(
      alphaEntry !== undefined && bravoEntry !== undefined,
      "expected both participants on the win-rate ladder"
    );
    expect(alphaEntry.tally).toEqual({ wins: 1, losses: 0, gamesPlayed: 1 });
    expect(bravoEntry.tally).toEqual({ wins: 0, losses: 1, gamesPlayed: 1 });
    // winner ranks above the loser
    expect(alphaEntry.rank).toBeLessThan(bravoEntry.rank);

    // --- player profiles reflect the same win/loss split ---
    const alphaProfile = await testFixture.ladderGameRecordsService.getPlayerProfileData(alphaId);
    const bravoProfile = await testFixture.ladderGameRecordsService.getPlayerProfileData(bravoId);
    expect(alphaProfile?.rankedRaceTally).toEqual({ wins: 1, losses: 0, gamesPlayed: 1 });
    expect(bravoProfile?.rankedRaceTally).toEqual({ wins: 0, losses: 1, gamesPlayed: 1 });

    // --- getFloorClearTimes(floor 1): both parties recorded a race floor-1 clear ---
    const floor1Page = await testFixture.ladderGameRecordsService.getFloorClearTimes({
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
