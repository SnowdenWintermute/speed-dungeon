import {
  BASIC_CHARACTER_FIXTURES,
  CombatActionName,
  CombatantClass,
  DungeonRoomType,
  FixedNumberGenerator,
  RandomNumberGenerationPolicyFactory,
  RNG_RANGE,
  TEST_DUNGEON_TWO_SPIDER_ROOMS,
} from "@speed-dungeon/common";
import { ActionMenuScreenType } from "@/client-application/action-menu/screen-types.js";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

export async function testTwoSpidersAndBurning(testFixture: IntegrationTestFixture) {
  const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
  const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
    counterAttack: fixedRngMinRoll,
    criticalStrike: fixedRngMinRoll,
    parry: fixedRngMinRoll,
    shieldBlock: fixedRngMinRoll,
  });
  await testFixture.createServers(
    rngPolicy,
    TEST_DUNGEON_TWO_SPIDER_ROOMS,
    BASIC_CHARACTER_FIXTURES
  );

  const client = testFixture.createClient("client 1");
  await client.connect();

  await client.lobbyClientHarness.createGame("a");
  await client.lobbyClientHarness.createParty("a");
  await client.lobbyClientHarness.createCharacter("a", CombatantClass.Warrior);
  await client.lobbyClientHarness.createCharacter("b", CombatantClass.Rogue);
  await client.lobbyClientHarness.toggleReadyToStartGame();
  const { clientApplication, gameClientHarness } = client;
  await clientApplication.sequentialEventProcessor.waitUntilIdle();
  await clientApplication.transitionToGameServer.waitFor();

  const { gameContext } = clientApplication;
  const game = gameContext.requireGame();
  const party = gameContext.requireParty();

  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
  await gameClientHarness.toggleReadyToExplore();
  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);

  let focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.PassTurn, 1);

  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.PassTurn, 1);

  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.selectCombatAction(focusedCharacterId, CombatActionName.Fire, 2);
  await gameClientHarness.cycleTargetingSchemes(focusedCharacterId);
  await gameClientHarness.useSelectedCombatAction(focusedCharacterId);

  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.PassTurn, 1);

  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.selectCombatAction(focusedCharacterId, CombatActionName.Fire, 3);
  await gameClientHarness.cycleTargetingSchemes(focusedCharacterId);
  await gameClientHarness.useSelectedCombatAction(focusedCharacterId);

  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.PassTurn, 1);
  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.PassTurn, 1);

  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.Attack, 1);

  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.Attack, 1);

  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.Attack, 1);
  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.Attack, 1);
  expect(party.battleId).toBe(null);
  expect(clientApplication.actionMenu.getCurrentMenu().type).toBe(
    ActionMenuScreenType.ItemsOnGround
  );
  focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
  await gameClientHarness.toggleReadyToExplore();

  try {
    focusedCharacterId = clientApplication.combatantFocus.requireFocusedCharacterId();
    await gameClientHarness.useCombatAction(focusedCharacterId, CombatActionName.Attack, 1);
  } catch (err) {
    expect(true).toBeFalsy();
  }
}
