import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionResolutionStepType,
  BASIC_CHARACTER_FIXTURES,
  BeforeOrAfter,
  ClientIntentType,
  CombatActionName,
  DungeonRoomType,
  GameStateUpdateType,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testReconnectionDuringVictoryReplay(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, BASIC_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const { alpha, bravo } = await testFixture.createTwoClientsInFirstMonsterLair();

  // submit action expected to kill last monster
  // await and advance time flush tree to midway through replay
  // reconnect
  // assert items on ground but can not be picked up
  // assert input locked while replay still playing out
  // assert items on ground / no longer in battle
  // items can be picked up by both players
}
