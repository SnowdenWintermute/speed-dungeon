import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { checkForIgnitedProjectile } from "@/test-utils/check-for-ignited-projectile";
import {
  ClientIntentType,
  CombatActionName,
  EPSILON,
  FixedNumberGenerator,
  LOW_HP_CHARACTER_FIXTURES,
  NextOrPrevious,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testRangedCounterattackThroughFirewallIgnite(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, LOW_HP_CHARACTER_FIXTURES, {
    counterAttack: new FixedNumberGenerator(1 - EPSILON),
  });
  const client = await testFixture.createClientInGame();

  const { clientApplication, gameClientHarness } = client;
  const { actionHistory } = gameClientHarness;
  const { combatantFocus } = clientApplication;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  const { combatantManager } = party;

  await gameClientHarness.selectHoldableHotswapSlot(1);
  combatantFocus.cycleFocusedCharacter(NextOrPrevious.Next);
  await gameClientHarness.selectHoldableHotswapSlot(1);

  await gameClientHarness.toggleReadyToExplore();
  await gameClientHarness.selectCombatAction(CombatActionName.Firewall, 2);
  await gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: combatantFocus.requireFocusedCharacterId() },
  });
  await checkForIgnitedProjectile(gameClientHarness, party);
  await gameClientHarness.flushReplayTree();
}
