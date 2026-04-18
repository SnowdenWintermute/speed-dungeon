import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantTurnTracker,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testSummonedPetTurnOrder(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, BASIC_CHARACTER_FIXTURES);
  const client = await testFixture.createClientInGame();
  const { clientApplication, gameClientHarness } = client;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  const game = gameContext.requireGame();

  const { combatantManager } = party;
  await gameClientHarness.toggleReadyToExplore();
  const battle = party.getBattleOption(game);
  invariant(battle !== null, "no battle");
  const { turnOrderManager } = battle;

  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent, 1);

  expect(
    turnOrderManager.getTrackers().find((tracker) => {
      if (!(tracker instanceof CombatantTurnTracker)) return;
      const expectedCombatant = combatantManager.getExpectedCombatant(tracker.getEntityId());
      if (expectedCombatant.combatantProperties.controlledBy.isPlayerPet()) return true;
    })
  ).toBeDefined();
}
