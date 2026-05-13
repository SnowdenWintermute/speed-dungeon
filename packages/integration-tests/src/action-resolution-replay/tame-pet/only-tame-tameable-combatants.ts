import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  ERROR_MESSAGES,
  TEST_DUNGEON_ZERO_SPEED_WOLF_AND_CULTIST,
} from "@speed-dungeon/common";

export async function testOnlyTameDamagedTameableCombatants(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(
    TEST_DUNGEON_ZERO_SPEED_WOLF_AND_CULTIST,
    BASIC_CHARACTER_FIXTURES
  );
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  const { combatantManager } = party;

  expect(combatantManager.getDungeonControlledCharacters().length).toBe(2);
  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(combatantManager.getDungeonControlledCharacters().length).toBe(2);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(combatantManager.getDungeonControlledCharacters().length).toBe(1);
  await gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED
  );
  expect(combatantManager.getDungeonControlledCharacters().length).toBe(1);
}
