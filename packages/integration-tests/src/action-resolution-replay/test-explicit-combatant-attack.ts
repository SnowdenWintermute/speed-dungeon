import { IntegrationTestFixture } from "@/types";
import {
  CombatActionName,
  DungeonRoomType,
  LobbyServer,
  invariant,
  BASIC_CHARACTER_FIXTURES,
} from "@speed-dungeon/common";

export function configureExplicitAttackTestCharacters(lobbyServer: LobbyServer) {
  const policy = lobbyServer.characterCreationPolicy;

  policy.setCharacters(BASIC_CHARACTER_FIXTURES);
}

export async function testExplicitCombatantAttack(testFixture: IntegrationTestFixture) {
  const { clientApplication, gameClientHarness } = testFixture;
  const { gameContext } = clientApplication;

  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
  await gameClientHarness.toggleReadyToExplore();
  expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);

  const focusedCharacter = clientApplication.combatantFocus.requireFocusedCharacter();
  const characterId = focusedCharacter.getEntityId();

  expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(100);
  const wolf = gameContext.requireParty().combatantManager.getDungeonControlledCombatants()[0];
  invariant(wolf !== undefined);
  expect(wolf.combatantProperties.resources.getHitPoints()).toBe(50);

  await gameClientHarness.useCombatAction(characterId, CombatActionName.Attack, 1);

  expect(wolf.combatantProperties.resources.getHitPoints()).toBe(46);
  expect(focusedCharacter.combatantProperties.resources.getHitPoints()).toBe(91);
}
