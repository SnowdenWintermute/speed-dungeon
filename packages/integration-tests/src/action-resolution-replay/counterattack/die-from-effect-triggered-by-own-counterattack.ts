import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionResolutionStepType,
  BeforeOrAfter,
  ClientIntentType,
  CombatActionName,
  CombatantClass,
  CREATE_SET_HP_CHARACTER_FIXTURES,
  EPSILON,
  FixedNumberGenerator,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testDieFromCounterattackTriggeredExplosion(
  testFixture: IntegrationTestFixture
) {
  const characterCreationFactories = CREATE_SET_HP_CHARACTER_FIXTURES(1);
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, characterCreationFactories, {
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
  const { combatantFocus } = clientApplication;
  const { gameContext } = clientApplication;
  const party = gameContext.requireParty();

  await gameClientHarness.toggleReadyToExplore();

  const firstMover = combatantFocus.requireFocusedCharacter();
  await gameClientHarness.useCombatAction(CombatActionName.IceBoltParent);
  await gameClientHarness.selectCombatAction(CombatActionName.PassTurn, 1);
  await gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: combatantFocus.requireFocusedCharacterId() },
  });
  let durationTicked = 0;
  durationTicked += await gameClientHarness.flushReplayTree({
    stoppingPoint: BeforeOrAfter.Before,
    actionName: CombatActionName.IceBurstExplosion,
    step: ActionResolutionStepType.OnActivationActionEntityMotion,
  });
  expect(firstMover.getCombatantProperties().isDead()).toBeFalsy();
  durationTicked += await gameClientHarness.flushReplayTree({
    stoppingPoint: BeforeOrAfter.After,
    actionName: CombatActionName.IceBurstExplosion,
    step: ActionResolutionStepType.RollIncomingHitOutcomes,
  });
  expect(firstMover.getCombatantProperties().isDead()).toBeTruthy();
  durationTicked += await gameClientHarness.flushReplayTree();
  testFixture.timeMachine.advanceTime(durationTicked);

  // ensure wipe works as well
  const secondMover = combatantFocus.requireFocusedCharacter();
  await gameClientHarness.selectCombatAction(CombatActionName.IceBoltParent, 1);
  await gameClientHarness.dispatchAndAwaitReply({
    type: ClientIntentType.UseSelectedCombatAction,
    data: { characterId: combatantFocus.requireFocusedCharacterId() },
  });
  let durationTickedSecond = 0;
  durationTickedSecond += await gameClientHarness.flushReplayTree({
    stoppingPoint: BeforeOrAfter.After,
    actionName: CombatActionName.IceBurstExplosion,
    step: ActionResolutionStepType.RollIncomingHitOutcomes,
  });

  expect(secondMover.getCombatantProperties().isDead()).toBeTruthy();

  durationTickedSecond += await gameClientHarness.flushReplayTree();

  expect(party.hasWiped()).toBeTruthy();
}
