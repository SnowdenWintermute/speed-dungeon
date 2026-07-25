import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { GameMode, invariant, PartyFateType, PlayerProfileLookupType } from "@speed-dungeon/common";
import { requirePartyOfCharacter } from "./aggregate-lookup";
import { TEST_AUTH_USERNAME_PLAYER_2 } from "@/fixtures/consts";

// Guards the trickiest race write-path case: a solo player leaving mid-run. Leaving a ranked race
// removes the player, which deletes their (now-empty) party from the LIVE game *before* the party is
// marked wiped — so the party-sweeping updateGameRecordAggregate in onPartyWipe can't see it. If the
// loss weren't recorded some other way, bravo's party would keep a null fate and computeRankedRaceTally
// would skip the game entirely (not even counting it as played). RankedRaceModeLadderPolicy.onPartyWipe
// persists the fate directly via updatePartyFate; this test proves that guard records the loss.
export async function testRankedRaceSoloLeaveRecordsLoss(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions();

  const { alpha, bravo, bravoCharacterName } = await testFixture.createTwoClientsInGameServerGame({
    auth: true,
    mode: GameMode.RankedRace,
    separateParties: true,
  });
  const gameId = alpha.clientApplication.gameContext.requireGame().id;

  // bravo is alone in their own party, so leaving detaches that party from the game before the wipe
  await bravo.clientApplication.gameClientRef.get().leaveGame();

  const aggregate = await testFixture.ladderGameRecordsService.requireGameRecordAggregate(gameId);
  const bravoParty = requirePartyOfCharacter(aggregate, bravoCharacterName);

  // the guard persisted the wipe fate on the detached party
  expect(bravoParty.party.fateOption?.type).toBe(PartyFateType.Wipe);

  // ...so the loss surfaces in what a client reads (a game played + a loss, not a skipped game)
  const ladderQueries = await testFixture.createLadderViewerQueries();
  const bravoLookup = await ladderQueries.getPlayerProfile(TEST_AUTH_USERNAME_PLAYER_2);
  invariant(bravoLookup.type === PlayerProfileLookupType.Found, "expected to find bravo");
  expect(bravoLookup.profile.rankedRaceRecord).toEqual({
    wins: 0,
    losses: 1,
    gamesPlayed: 1,
    winRate: 0,
  });

  const winRatePage = await ladderQueries.getWinRateLadder({
    page: 0,
    minimumGamesPlayed: 1,
  });
  const bravoEntry = winRatePage.entries.find(
    (entry) => entry.username === TEST_AUTH_USERNAME_PLAYER_2
  );
  invariant(
    bravoEntry !== undefined,
    "expected bravo on the win-rate ladder after recording a loss"
  );
  expect(bravoEntry.record).toEqual({ wins: 0, losses: 1, gamesPlayed: 1, winRate: 0 });
}
