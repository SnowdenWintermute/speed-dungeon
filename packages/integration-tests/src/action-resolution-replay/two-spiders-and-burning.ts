import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  DungeonRoomType,
  TEST_DUNGEON_TWO_SPIDER_ROOMS,
} from "@speed-dungeon/common";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types.js";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testTwoSpidersAndBurning(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_TWO_SPIDER_ROOMS,
    BASIC_CHARACTER_FIXTURES
  );
  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
  await gameClientHarness.toggleReadyToExplore();
  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.selectCombatAction(CombatActionName.Fire, 2);
  await gameClientHarness.cycleTargetingSchemes();
  await gameClientHarness.useSelectedCombatAction();
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.selectCombatAction(CombatActionName.Fire, 3);
  await gameClientHarness.cycleTargetingSchemes();
  await gameClientHarness.useSelectedCombatAction();
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);

  expect(party.battleId).toBe(null);
  expect(clientApplication.actionMenu.getCurrentMenu().type).toBe(
    ActionMenuScreenType.ItemsOnGround
  );
  await gameClientHarness.toggleReadyToExplore();

  try {
    await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  } catch (err) {
    expect(true).toBeFalsy();
  }
}
