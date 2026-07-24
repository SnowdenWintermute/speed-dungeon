import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { GameMode, invariant, PartyFateType } from "@speed-dungeon/common";
import { requireOwnerId, requirePartyOfCharacter } from "./aggregate-lookup";

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
  const bravoId = requireOwnerId(bravoParty, bravoCharacterName);

  // the guard persisted the wipe fate on the detached party
  expect(bravoParty.party.fateOption?.type).toBe(PartyFateType.Wipe);

  // ...so the loss surfaces in the read queries (a game played + a loss, not a skipped game)
  const bravoProfile = await testFixture.ladderGameRecordsService.getPlayerProfileData(bravoId);
  expect(bravoProfile?.rankedRaceTally).toEqual({ wins: 0, losses: 1, gamesPlayed: 1 });

  const winRatePage = await testFixture.ladderGameRecordsService.getWinRateLadder({
    page: 0,
    minimumGamesPlayed: 1,
  });
  const bravoEntry = winRatePage.entries.find((entry) => entry.participantId === bravoId);
  invariant(bravoEntry !== undefined, "expected bravo on the win-rate ladder after recording a loss");
  expect(bravoEntry.tally).toEqual({ wins: 0, losses: 1, gamesPlayed: 1 });
}
