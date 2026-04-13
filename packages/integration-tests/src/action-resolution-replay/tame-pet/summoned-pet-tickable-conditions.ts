import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  ConditionTurnTracker,
  invariant,
  NextOrPrevious,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testSummonedPetTickableConditions(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_TWO_WOLF_ROOMS,
    BASIC_CHARACTER_FIXTURES
  );
  const { clientApplication, gameClientHarness } = client;
  const { gameContext, combatantFocus } = clientApplication;
  const party = gameContext.requireParty();
  const game = gameContext.requireGame();

  const { combatantManager } = party;
  await gameClientHarness.toggleReadyToExplore();

  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.selectCombatAction(CombatActionName.Fire, 1);
  await gameClientHarness.cycleTargets(NextOrPrevious.Next);
  await gameClientHarness.useSelectedCombatAction();

  const battle = party.getBattleOption(game);
  invariant(battle !== null, "no battle");

  const { turnOrderManager } = battle;

  expect(combatantManager.getAllTickableConditionsAndCombatants().tickableConditions.length).toBe(
    1
  );
  expect(
    turnOrderManager.getTrackers().find((tracker) => tracker instanceof ConditionTurnTracker)
  ).toBeDefined();

  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(combatantManager.getAllTickableConditionsAndCombatants().tickableConditions.length).toBe(
    0
  );
  expect(
    turnOrderManager.getTrackers().find((tracker) => tracker instanceof ConditionTurnTracker)
  ).toBeUndefined();
  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent, 1);
  expect(combatantManager.getAllTickableConditionsAndCombatants().tickableConditions.length).toBe(
    1
  );
  expect(
    turnOrderManager.getTrackers().find((tracker) => tracker instanceof ConditionTurnTracker)
  ).toBeDefined();
}
