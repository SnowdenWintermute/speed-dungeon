import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

export async function testPetAi(testFixture: IntegrationTestFixture) {
  const client = await testFixture.resetWithOptions(
    TEST_DUNGEON_TWO_WOLF_ROOMS,
    HIGH_LEVEL_CHARARCTER_FIXTURES_WITH_PETS
  );
  const { clientApplication, gameClientHarness } = client;
  const { gameContext, combatantFocus } = clientApplication;
  const party = gameContext.requireParty();
  const game = gameContext.requireGame();
  await gameClientHarness.toggleReadyToExplore();
  const battle = party.getBattleOption(game);
  invariant(battle !== null, "no battle");
  // tamed pet with no pet command attacks monsters
  // assist command attacks most recent owner target using mana skills if possible and pet desires it
  // kill command attacks lowest hp enemy target (and doesn't heal it if has healing)
}
