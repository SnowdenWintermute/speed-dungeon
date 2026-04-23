import { testToCharacterInParty } from "@/fixtures/test-to-character-in-party";
import { IntegrationTestFixture } from "@/types";
import {
  ClientIntentType,
  CombatActionName,
  CombatantClass,
  DungeonRoomType,
  invariant,
} from "@speed-dungeon/common";

export async function testLeaveAndCreateNewGame(testSurface: IntegrationTestFixture) {
  const { clientApplication, lobbyClientHarness, gameClientHarness } = testSurface;
  const { gameContext, gameClientRef } = clientApplication;

  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
  await gameClientHarness.toggleReadyToExplore();
  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);

  const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
  const characterId = focusedCharacter.getEntityId();

  await gameClientHarness.selectHoldableHotswapSlot(characterId, 2);
  await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);

  const expectedMonster = gameContext
    .requireParty()
    .combatantManager.getDungeonControlledCombatants()[0];

  expect(expectedMonster?.combatantProperties.resources.getHitPoints()).toBe(48);
  expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(37);
  await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);
  expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(28);
  gameClientRef.get().leaveGame();

  expect(gameContext.gameOption).toBe(null);

  await clientApplication.transitionToLobbyServer.waitFor();

  await testToCharacterInParty(
    lobbyClientHarness,
    clientApplication,
    CombatantClass.Warrior,
    "game 2"
  );
  await lobbyClientHarness.settleIntentResult({
    type: ClientIntentType.ToggleReadyToStartGame,
    data: undefined,
  });

  await clientApplication.transitionToGameServer.waitFor();

  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
  await gameClientHarness.toggleReadyToExplore();
  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);

  const focusedCharacterSecondGame = clientApplication.combatantFocus.requireFocusedCharacter();
  const characterIdSecondGame = focusedCharacter.getEntityId();
  const expectedMonsterSecondGame = gameContext
    .requireParty()
    .combatantManager.getDungeonControlledCombatants()[0];
  invariant(expectedMonsterSecondGame !== undefined);
  expect(expectedMonsterSecondGame.combatantProperties.resources.getHitPoints()).toBe(54);
}
