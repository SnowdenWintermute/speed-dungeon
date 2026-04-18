import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionResolutionStepType,
  BASIC_CHARACTER_FIXTURES,
  BeforeOrAfter,
  ClientIntentType,
  CombatActionName,
  MONSTER_FIXTURE_NAMES,
  TEST_DUNGEON_ONE_LOW_HP_WOLF_ONE_NORMAL,
} from "@speed-dungeon/common";

export async function deathInFirewallOnMeleeApproach(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(
    TEST_DUNGEON_ONE_LOW_HP_WOLF_ONE_NORMAL,
    BASIC_CHARACTER_FIXTURES
  );
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { combatantFocus } = clientApplication;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  await gameClientHarness.toggleReadyToExplore();

  await gameClientHarness.useCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.selectCombatAction(CombatActionName.Firewall, 3);
  await gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: combatantFocus.requireFocusedCharacterId() },
  });
  const testWolf = party.combatantManager.requireCombatantByName(MONSTER_FIXTURE_NAMES.WOLF_LOW_HP);
  expect(testWolf.combatantProperties.isDead()).toBeFalsy();
  await gameClientHarness.flushReplayTree({
    stoppingPoint: BeforeOrAfter.After,
    actionName: CombatActionName.FirewallBurn,
    step: ActionResolutionStepType.RollIncomingHitOutcomes,
  });
  expect(testWolf.combatantProperties.isDead()).toBeTruthy();
  expect(party.inputLock.isLocked()).toBeTruthy();
  await gameClientHarness.flushReplayTree({
    stoppingPoint: BeforeOrAfter.After,
    actionName: CombatActionName.AttackMeleeMainhand,
    step: ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock,
  });
  expect(party.inputLock.isLocked()).toBeFalsy();
}
