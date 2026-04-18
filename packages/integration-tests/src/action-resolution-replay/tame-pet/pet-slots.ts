import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  AbilityType,
  CombatActionName,
  ERROR_MESSAGES,
  HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS,
  invariant,
  MONSTER_FIXTURES,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testPetSlotLimitations(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(
    TEST_DUNGEON_TWO_WOLF_ROOMS,
    HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS([
      (idGenerator, itemBuilder, rngPolicy, name) =>
        MONSTER_FIXTURES.WOLF(idGenerator, itemBuilder, rngPolicy).build(idGenerator),
    ])
  );
  const client = await testFixture.createSingleClientInStartedGame();
  const { clientApplication, gameClientHarness } = client;
  const { gameContext, combatantFocus } = clientApplication;
  const party = gameContext.requireParty();
  const game = gameContext.requireGame();
  await gameClientHarness.toggleReadyToExplore();
  const battle = party.getBattleOption(game);
  invariant(battle !== null, "no battle");

  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.COMBAT_ACTIONS.PET_SLOTS_FULL(1)
  );
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  const petTamer = combatantFocus.requireFocusedCharacter();
  expect(party.petManager.getAllPetsByOwnerId(petTamer.getEntityId()).length).toBe(1);
  await gameClientHarness.useCombatAction(CombatActionName.ReleasePet, 1);
  expect(party.petManager.getAllPetsByOwnerId(petTamer.getEntityId()).length).toBe(0);
  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(party.petManager.getAllPetsByOwnerId(petTamer.getEntityId()).length).toBe(1);
  await gameClientHarness.useCombatAction(CombatActionName.Attack, 1);
  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  // higher rank allows taming additional slot
  expect(clientApplication.errorRecordService.getLastError()?.message).toBe(
    ERROR_MESSAGES.COMBAT_ACTIONS.PET_SLOTS_FULL(1)
  );
  await gameClientHarness.allocateAbilityPoint({
    type: AbilityType.Action,
    actionName: CombatActionName.TamePet,
  });
  await gameClientHarness.useCombatAction(CombatActionName.TamePet, 1);
  expect(party.petManager.getAllPetsByOwnerId(petTamer.getEntityId()).length).toBe(2);
  // battle ends if last remaning monster is tamed
  expect(party.getBattleOption(game)).toBe(null);
}
