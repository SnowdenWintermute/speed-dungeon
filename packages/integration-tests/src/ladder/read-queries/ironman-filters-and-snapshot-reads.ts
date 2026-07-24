import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  GameMode,
  invariant,
  ONE_SECOND,
  TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE,
} from "@speed-dungeon/common";

// Rounds out the read-query coverage against a single Ironman run (one floor-1 clear, played under the
// default Captain control scheme): the mode/control-scheme filters on getFloorClearTimes and the
// per-character snapshot hydration (getCharacterFloorClearSnapshot).
//
// NOT covered here: the experience-points ladder facet — it's Progression-only (this is an Ironman
// run), and progression characters are hydrated from their actual persisted character entities, not
// from ladder records, so it belongs to the separate XP-ladder work (step 8 in the notes).
export async function testIronmanReadQueryFiltersAndSnapshot(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_THREE_FLOORS_IMMEDIATE_STAIRCASE);
  testFixture.timeMachine.start();
  const { client: alpha, characterName } = await testFixture.createSingleClientInGameServerGame();

  // clear floor 1
  testFixture.timeMachine.advanceTime(ONE_SECOND);
  await alpha.gameClientHarness.toggleReadyToDescend();

  const service = testFixture.ladderGameRecordsService;

  // the unfiltered floor-1 read gives us the recorded character + its snapshot id to drill into
  const basePage = await service.getFloorClearTimes({ floor: 1, page: 0 });
  expect(basePage.entries).toHaveLength(1);
  const entry = basePage.entries[0];
  invariant(entry !== undefined, "expected a floor-1 entry");
  const floorClearCharacter = entry.characters[0];
  invariant(floorClearCharacter !== undefined, "expected a character on the floor-1 entry");
  const { characterId, snapshotIdOption } = floorClearCharacter;
  invariant(snapshotIdOption !== undefined, "expected a snapshot id on the floor-1 character");

  // --- mode filter: matches Ironman, excludes any other mode ---
  expect(
    (await service.getFloorClearTimes({ floor: 1, page: 0, modeOption: GameMode.Ironman })).entries
  ).toHaveLength(1);
  expect(
    (await service.getFloorClearTimes({ floor: 1, page: 0, modeOption: GameMode.RankedRace })).entries
  ).toHaveLength(0);

  // --- control-scheme filter: matches Captain (the run's scheme), excludes Freelancer ---
  expect(
    (
      await service.getFloorClearTimes({
        floor: 1,
        page: 0,
        controlSchemeOption: CharacterControlScheme.Captain,
      })
    ).entries
  ).toHaveLength(1);
  expect(
    (
      await service.getFloorClearTimes({
        floor: 1,
        page: 0,
        controlSchemeOption: CharacterControlScheme.Freelancer,
      })
    ).entries
  ).toHaveLength(0);

  // --- getCharacterFloorClearSnapshot: the entry's snapshot id hydrates the stored combatant ---
  const snapshot = await service.getCharacterFloorClearSnapshot(snapshotIdOption);
  invariant(snapshot !== undefined, "expected a snapshot for the floor-1 character");
  expect(snapshot.id).toBe(snapshotIdOption);
  expect(snapshot.characterRecordId).toBe(characterId);
  expect(snapshot.characterName).toBe(characterName);
  expect(snapshot.combatantWithPets.combatant).toBeDefined();
}
