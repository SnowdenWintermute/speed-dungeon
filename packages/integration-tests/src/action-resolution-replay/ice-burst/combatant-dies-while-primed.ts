import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantConditionName,
  invariant,
  TEST_DUNGEON_TWO_MID_HP_WOLVES,
} from "@speed-dungeon/common";

export async function testCombatantDiesWhilePrimedForIceBurst(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_MID_HP_WOLVES, BASIC_CHARACTER_FIXTURES);
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { actionHistory } = gameClientHarness;
  const { combatantFocus } = clientApplication;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  const { combatantManager } = party;
  await gameClientHarness.toggleReadyToExplore();

  await gameClientHarness.useCombatAction(CombatActionName.IceBoltParent);
  const killerOfFirstWolfId = combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(CombatActionName.Attack);
  const killedWolfId = actionHistory.requireLastUsedActionSingleTargetId(killerOfFirstWolfId);
  const killedWolf = combatantManager.getExpectedCombatant(killedWolfId);
  expect(killedWolf.combatantProperties.isDead()).toBeTruthy();
  // remaining alive wolf has primed
  const monsters = combatantManager.getDungeonControlledCombatants();
  const remainingWolf = monsters.find(
    (combatant) => combatant.getCombatantProperties().resources.getHitPoints() > 0
  );
  invariant(remainingWolf !== undefined);
  expect(
    remainingWolf
      .getCombatantProperties()
      .conditionManager.getConditionByName(CombatantConditionName.PrimedForIceBurst)
  ).toBeDefined();
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  await gameClientHarness.useCombatAction(CombatActionName.Attack);
  expect(clientApplication.errorRecordService.getLastError()).toBeUndefined();
}
