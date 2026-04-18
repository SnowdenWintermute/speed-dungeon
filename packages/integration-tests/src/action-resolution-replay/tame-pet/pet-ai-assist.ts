import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  AbilityType,
  CombatActionName,
  HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS,
  invariant,
  MONSTER_FIXTURES,
  NextOrPrevious,
  TEST_DUNGEON_MANTA_TWO_WOLF,
} from "@speed-dungeon/common";

export async function testPetAiAssist(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(
    TEST_DUNGEON_MANTA_TWO_WOLF,
    HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS([
      (idGenerator, itemBuilder, rngPolicy, name) =>
        MONSTER_FIXTURES.MANTA_RAY(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
    ])
  );
  const client = await testFixture.createClientInGame();
  const { clientApplication, gameClientHarness } = client;
  const { gameContext, combatantFocus } = clientApplication;
  const { actionHistory } = gameClientHarness;
  const party = gameContext.requireParty();
  const { combatantManager } = party;
  const game = gameContext.requireGame();

  // need rank 2 tame pet to issue pet command
  await gameClientHarness.allocateAbilityPoint({
    type: AbilityType.Action,
    actionName: CombatActionName.TamePet,
  });
  // manta ray should be in first slot, use rank 1
  await gameClientHarness.useCombatAction(CombatActionName.SummonPetParent, 1);
  const petOwner = combatantFocus.requireFocusedCharacter();
  const mantaRay = combatantManager.getPartyMemberPets()[0];
  invariant(mantaRay !== undefined);
  expect(mantaRay.combatantProperties.controlledBy.summonedBy).toBe(petOwner.getEntityId());
  // rank 1 = "Assist"
  await gameClientHarness.useCombatAction(CombatActionName.PetCommand, 1);

  await gameClientHarness.toggleReadyToExplore();
  const battle = party.getBattleOption(game);
  invariant(battle !== null, "no battle");

  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);
  expect(combatantFocus.requireFocusedCharacter().getEntityId()).toBe(petOwner.getEntityId());
  await gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.cycleTargets(NextOrPrevious.Next);
  await gameClientHarness.useSelectedCombatAction();
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);

  expect(
    actionHistory.actionUsersHadSameSingleTarget(petOwner.getEntityId(), mantaRay.getEntityId())
  ).toBeTruthy();
  // ensure pet could have still targeted their previous target
  expect(actionHistory.lastTargetedSingleStillAlive(mantaRay.getEntityId())).toBe(true);
  // choose a different target with pet owner
  expect(combatantFocus.requireFocusedCharacterId()).toBe(petOwner.getEntityId());
  await gameClientHarness.selectCombatAction(CombatActionName.Healing, 1);
  await gameClientHarness.cycleTargets(NextOrPrevious.Previous);
  await gameClientHarness.cycleTargets(NextOrPrevious.Previous);
  await gameClientHarness.cycleTargets(NextOrPrevious.Previous);
  await gameClientHarness.useSelectedCombatAction();
  await gameClientHarness.useCombatAction(CombatActionName.PassTurn);

  expect(
    gameClientHarness.actionHistory.actionUsersHadSameSingleTarget(
      petOwner.getEntityId(),
      mantaRay.getEntityId()
    )
  ).toBeTruthy();

  //
}
