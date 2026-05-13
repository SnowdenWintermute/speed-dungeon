import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CombatActionName,
  CombatantClass,
  EPSILON,
  FixedNumberGenerator,
  LOW_HP_CHARACTER_FIXTURES,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testDieFromCounterattackTriggeredExplosion(
  testFixture: IntegrationTestFixture
) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, LOW_HP_CHARACTER_FIXTURES, {
    counterAttack: new FixedNumberGenerator(1 - EPSILON),
  });
  testFixture.timeMachine.start();

  const client = await testFixture.createSingleClientInStartedGame(
    // warriors start with swords, who's animation is fast enough to set off the explosion
    // while still in range. The Rogue's daggers hit after the wolf has walked back out of range.
    [
      { name: "warrior 1", combatantClass: CombatantClass.Warrior },
      { name: "warrior 2", combatantClass: CombatantClass.Warrior },
    ]
  );
  const { clientApplication, gameClientHarness } = client;
  const { actionHistory } = gameClientHarness;
  const { combatantFocus } = clientApplication;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();
  const { combatantManager } = party;

  await gameClientHarness.toggleReadyToExplore();

  const firstMover = combatantFocus.requireFocusedCharacter();
  await gameClientHarness.useCombatAction(CombatActionName.IceBoltParent);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  testFixture.timeMachine.advanceTime(clientApplication.uiStore.replayResolutionTimeoutDuration);
  expect(firstMover.getCombatantProperties().isDead()).toBeTruthy();
  const secondMover = combatantFocus.requireFocusedCharacter();
  await gameClientHarness.useCombatAction(CombatActionName.IceBoltParent);
  testFixture.timeMachine.advanceTime(clientApplication.uiStore.replayResolutionTimeoutDuration);
  expect(secondMover.getCombatantProperties().isDead()).toBeTruthy();

  expect(party.timeOfWipe).toBeDefined();
}
