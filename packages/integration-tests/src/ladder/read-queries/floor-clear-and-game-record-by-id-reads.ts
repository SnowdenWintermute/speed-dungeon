import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { MISSING_RECORD_ID, TEST_AUTH_USERNAME_PLAYER_1 } from "@/fixtures/consts";
import {
  GameId,
  GameMode,
  LadderPartyFloorClearRecordId,
  invariant,
  ONE_SECOND,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";

// The two individually-linkable reads: one floor clear on its own, and one whole game record. Both
// are read the way the pages will read them — a client in the lobby running LadderQueries over the
// socket — and both are checked against the board row / write-path aggregate they are reached from.
export async function testFloorClearAndGameRecordByIdReads(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();
  const {
    client: alpha,
    gameId,
    characterName,
  } = await testFixture.createSingleClientInGameServerGame();

  testFixture.timeMachine.advanceTime(ONE_SECOND);
  await alpha.gameClientHarness.toggleReadyToDescend();
  testFixture.timeMachine.advanceTime(ONE_SECOND * 2);
  await alpha.gameClientHarness.toggleReadyToDescend();

  // ground truth from the write path
  const aggregate = await testFixture.ladderGameRecordsService.requireGameRecordAggregate(gameId);
  const partyAggregate = aggregate.parties[0];
  invariant(partyAggregate !== undefined, "expected a recorded party");
  const floorClearsByFloor = new Map(
    partyAggregate.floorClears.map((clear) => [clear.floor, clear])
  );
  const floor1Clear = floorClearsByFloor.get(1);
  const floor2Clear = floorClearsByFloor.get(2);
  invariant(
    floor1Clear !== undefined && floor2Clear !== undefined,
    "expected floor 1 and floor 2 clear records from two descents"
  );
  const recordedCharacter = partyAggregate.characters[0];
  invariant(recordedCharacter !== undefined, "expected a recorded character");

  const ladderQueries = await testFixture.createLadderViewerQueries();

  // --- getFloorClear: the same clear the board shows, minus the board's own rank ---
  const boardPage = await ladderQueries.getFloorClearTimes({ floor: 2, page: 0 });
  const boardEntry = boardPage.entries[0];
  invariant(boardEntry !== undefined, "expected the floor 2 clear on the board");
  const { rank, ...boardEntryWithoutRank } = boardEntry;
  expect(rank).toBe(1);

  const standaloneClear = await ladderQueries.getFloorClear(floor2Clear.id);
  invariant(standaloneClear !== undefined, "expected the floor 2 clear to be fetchable by id");
  // every figure matches the row it was reached from — cumulative time included, which is the one
  // the standalone read has to re-derive from the party's history rather than read off a board
  expect(standaloneClear).toEqual(boardEntryWithoutRank);
  expect(standaloneClear.id).toBe(floor2Clear.id);
  expect(standaloneClear.cumulativeTimeToClearFloor).toBe(
    floor1Clear.timeSpentOnFloor + floor2Clear.timeSpentOnFloor
  );
  expect(standaloneClear.players).toEqual([TEST_AUTH_USERNAME_PLAYER_1]);

  const missingClearOption = await ladderQueries.getFloorClear(
    MISSING_RECORD_ID as LadderPartyFloorClearRecordId
  );
  expect(missingClearOption).toBe(undefined);

  // --- getGameRecord: the game, its parties, and what each party cleared ---
  const gameRecord = await ladderQueries.getGameRecord(gameId);
  invariant(gameRecord !== undefined, "expected the game record to be fetchable by id");
  expect(gameRecord.gameRecordId).toBe(gameId);
  expect(gameRecord.mode).toBe(GameMode.Ironman);
  expect(gameRecord.timeStarted).toBe(aggregate.game.timeStarted);
  // the client sees usernames here too; the id the game was recorded under stays on the server
  expect(gameRecord.participants).toEqual([
    { username: TEST_AUTH_USERNAME_PLAYER_1, abandonedAtOption: undefined },
  ]);

  expect(gameRecord.parties).toHaveLength(1);
  const party = gameRecord.parties[0];
  invariant(party !== undefined, "expected a party on the game record");
  expect(party.partyRecordId).toBe(partyAggregate.party.id);
  expect(party.partyName).toBe(partyAggregate.party.name);
  expect(party.deepestFloorReached).toBe(partyAggregate.party.deepestFloorReached);

  expect(party.characters).toHaveLength(1);
  const character = party.characters[0];
  invariant(character !== undefined, "expected a character on the party");
  expect(character.characterId).toBe(recordedCharacter.character.id);
  expect(character.characterName).toBe(characterName);
  expect(character.owner).toBe(TEST_AUTH_USERNAME_PLAYER_1);

  // shallow floors first, whatever order storage handed them over in
  expect(party.floorClears.map((clear) => clear.floor)).toEqual([1, 2]);
  const recordFloor2 = party.floorClears[1];
  invariant(recordFloor2 !== undefined, "expected the floor 2 clear on the game record");
  expect(recordFloor2.id).toBe(floor2Clear.id);
  expect(recordFloor2.timeSpentOnFloor).toBe(floor2Clear.timeSpentOnFloor);
  expect(recordFloor2.cumulativeTimeToClearFloor).toBe(
    floor1Clear.timeSpentOnFloor + floor2Clear.timeSpentOnFloor
  );

  // the snapshot link sits on the clear here, since the characters are listed once for the party
  const floor2Snapshot = recordedCharacter.floorClearedSnapshots.find(
    (snapshot) => snapshot.partyFloorClearRecord === floor2Clear.id
  );
  invariant(floor2Snapshot !== undefined, "expected a character snapshot for the floor 2 clear");
  expect(recordFloor2.characterSnapshots).toEqual([
    { characterId: recordedCharacter.character.id, snapshotId: floor2Snapshot.id },
  ]);

  // and it is a real snapshot id: the linked-to page can be fetched with it
  const snapshot = await ladderQueries.getCharacterFloorClearSnapshot(floor2Snapshot.id);
  invariant(snapshot !== undefined, "expected the linked snapshot to be fetchable");
  expect(snapshot.characterName).toBe(characterName);

  expect(await ladderQueries.getGameRecord(MISSING_RECORD_ID as GameId)).toBe(undefined);
}
