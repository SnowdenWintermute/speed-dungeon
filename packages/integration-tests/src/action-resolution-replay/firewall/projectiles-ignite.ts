import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { checkForIgnitedProjectile } from "@/test-utils/check-for-ignited-projectile";
import {
  BASIC_CHARACTER_FIXTURES,
  ClientIntentType,
  CombatActionName,
  NextOrPrevious,
  TEST_DUNGEON_ZERO_SPEED_WOLVES,
} from "@speed-dungeon/common";

export async function testFirewallIgnitesProjectiles(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_ZERO_SPEED_WOLVES, BASIC_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { gameContext, combatantFocus } = clientApplication;
  const party = gameContext.requireParty();

  await gameClientHarness.selectHoldableHotswapSlot(1);
  clientApplication.combatantFocus.cycleFocusedCharacter(NextOrPrevious.Next);
  await gameClientHarness.selectHoldableHotswapSlot(1);

  await gameClientHarness.toggleReadyToExplore();
  await gameClientHarness.useCombatAction(CombatActionName.Firewall, 2);

  await gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: combatantFocus.requireFocusedCharacterId() },
  });
  await checkForIgnitedProjectile(gameClientHarness, party);
}
