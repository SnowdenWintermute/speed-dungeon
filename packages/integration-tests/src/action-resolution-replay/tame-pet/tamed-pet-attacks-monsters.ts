import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  invariant,
  NextOrPrevious,
  TEST_DUNGEON_MANTA_TWO_WOLF,
} from "@speed-dungeon/common";

export async function testTamedPetHealsAlliesAttacksMonsters(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_MANTA_TWO_WOLF, BASIC_CHARACTER_FIXTURES);
  testFixture.timeMachine.start();
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { actionHistory } = gameClientHarness;
  const { gameContext, combatantFocus } = clientApplication;
  const party = gameContext.requireParty();

  const { combatantManager } = party;
  await gameClientHarness.toggleReadyToExplore();

  await gameClientHarness.selectCombatAction(CombatActionName.IceBoltParent, 1);
  await gameClientHarness.cycleTargets(NextOrPrevious.Previous);
  await gameClientHarness.useSelectedCombatAction();
  const petTamerId = combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(CombatActionName.TamePet);
  const petId = actionHistory.requireLastUsedActionSingleTargetId(petTamerId);
  invariant(petId !== undefined);
  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  // pet has healing ability and no pet command, should heal damaged allies
  const petHealingAction = actionHistory.getLastUsedBy(petId);
  expect(petHealingAction?.actionExecutionIntent.actionName).toBe(CombatActionName.Healing);
  const petHealingTargetId = actionHistory.requireLastUsedActionSingleTargetId(petId);
  invariant(petHealingTargetId !== undefined);
  expect(
    combatantManager
      .getPartyMemberCharacters()
      .map((combatant) => combatant.getEntityId())
      .includes(petHealingTargetId)
  );
  // player characters heal themselves above threshold for ai to target them with healing
  await gameClientHarness.selectCombatAction(CombatActionName.Healing, 3);
  await gameClientHarness.cycleTargets(NextOrPrevious.Next);
  await gameClientHarness.useSelectedCombatAction();
  await gameClientHarness.useCombatAction(CombatActionName.Healing, 3);
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  // pet should attack dungeon combatants
  const petIceBoltTargetId = actionHistory.requireLastUsedActionSingleTargetId(petId);
  invariant(petIceBoltTargetId !== undefined);
  expect(
    combatantManager
      .getDungeonControlledCombatants()
      .map((combatant) => combatant.getEntityId())
      .includes(petIceBoltTargetId)
  );
}
