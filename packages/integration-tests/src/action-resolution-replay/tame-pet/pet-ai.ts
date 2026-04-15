import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  AbilityType,
  CombatActionName,
  CombatActionTargetType,
  CombatantConditionName,
  HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS,
  invariant,
  MONSTER_FIXTURES,
  TEST_DUNGEON_MANTA_TWO_WOLF,
} from "@speed-dungeon/common";

export async function testPetAi(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_MANTA_TWO_WOLF,
    HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS([
      (idGenerator, itemBuilder, rngPolicy, name) =>
        MONSTER_FIXTURES.MANTA_RAY(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
    ])
  );
  const { clientApplication, gameClientHarness } = client;
  const { gameContext, combatantFocus } = clientApplication;
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
  // rank 2 = "Kill"
  await gameClientHarness.useCombatAction(CombatActionName.PetCommand, 2);
  expect(
    mantaRay.combatantProperties.conditionManager.getConditionByName(
      CombatantConditionName.FollowingPetCommand
    )?.rank
  ).toBe(2);

  await gameClientHarness.toggleReadyToExplore();
  const battle = party.getBattleOption(game);
  invariant(battle !== null, "no battle");
  const lowestHpMonster = combatantManager
    .getDungeonControlledCombatants()
    .sort(
      (a, b) =>
        a.getCombatantProperties().resources.getHitPoints() -
        b.getCombatantProperties().resources.getHitPoints()
    )[0];

  await gameClientHarness.useCombatAction(CombatActionName.Attack);

  const mantaRayActionTaken = clientApplication.clientLogRecorder.getLastAiActionUsedBy(
    mantaRay.getEntityId()
  );
  invariant(
    mantaRayActionTaken?.actionExecutionIntent.targets.type === CombatActionTargetType.Single
  );
  expect(mantaRayActionTaken?.actionExecutionIntent.targets.targetId).toBe(
    lowestHpMonster?.getEntityId()
  );
}
