import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  ActionResolutionStepType,
  BASIC_CHARACTER_FIXTURES,
  BeforeOrAfter,
  ClientIntentType,
  CombatActionName,
  DungeonRoomType,
  GameStateUpdateType,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";

// reconnect during action replay
// - shows "resolving replay in progress"
// - unlocks input after timeout
// - can execute input

export async function testReconnectionDuringActionReplay(testFixture: IntegrationTestFixture) {
  await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS, BASIC_CHARACTER_FIXTURES);

  const { alpha, bravo } = await testFixture.createTwoClientsInGameServerGame();

  const partyA = alpha.gameClientHarness.clientApplication.gameContext.requireParty();
  const partyB = bravo.gameClientHarness.clientApplication.gameContext.requireParty();
  expect(partyA.currentRoom.requireType(DungeonRoomType.Empty));
  expect(partyB.currentRoom.requireType(DungeonRoomType.Empty));

  await alpha.gameClientHarness.toggleReadyToExplore();
  await bravo.gameClientHarness.toggleReadyToExplore();
  expect(partyA.currentRoom.requireType(DungeonRoomType.MonsterLair));
  expect(partyB.currentRoom.requireType(DungeonRoomType.MonsterLair));

  await alpha.gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
  await Promise.all([
    alpha.gameClientHarness.dispatchAndAwaitReply({
      type: ClientIntentType.UseSelectedCombatAction,
      data: { characterId: alpha.clientApplication.combatantFocus.requireFocusedCharacterId() },
    }),
    bravo.gameClientHarness.awaitMessageOfType(GameStateUpdateType.ClientSequentialEvents),
  ]);

  const partialReplayStoppingPoint = {
    stoppingPoint: BeforeOrAfter.After,
    actionName: CombatActionName.AttackMeleeMainhand,
    step: ActionResolutionStepType.RollIncomingHitOutcomes,
  };
  await Promise.all([
    alpha.gameClientHarness.flushReplayTree(partialReplayStoppingPoint),
    bravo.gameClientHarness.flushReplayTree(partialReplayStoppingPoint),
  ]);

  await bravo.clientApplication.gameClientRef.get().close();

  await alpha.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity
  );

  await bravo.connect();
  await bravo.lobbyClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  const reconnectionFullGameUpdatePromise = bravo.gameClientHarness.awaitMessageOfType(
    GameStateUpdateType.GameFullUpdate
  );
  await alpha.gameClientHarness.awaitMessageOfType(GameStateUpdateType.PlayerJoinedGame);
  const reconnectionFullGameUpdate = await reconnectionFullGameUpdatePromise;

  await alpha.gameClientHarness.flushReplayTree();
  console.log(
    "alpha trackers",
    alpha.clientApplication.gameContext
      .requireParty()
      .requireBattle(alpha.clientApplication.gameContext.requireGame()).turnOrderManager
      .turnSchedulerManager
  );
  console.log(
    "bravo reconnection trackers:",

    bravo.clientApplication.gameContext
      .requireParty()
      .requireBattle(bravo.clientApplication.gameContext.requireGame()).turnOrderManager
      .turnSchedulerManager
  );

  // after reconnect
  const party = bravo.gameClientHarness.clientApplication.gameContext.requireParty();
  const game = bravo.gameClientHarness.clientApplication.gameContext.requireGame();

  party.currentRoom.requireType(DungeonRoomType.MonsterLair);
  expect(party.requireBattle(game).turnOrderManager.getTrackers()).toStrictEqual(
    alpha.clientApplication.gameContext
      .requireParty()
      .requireBattle(alpha.clientApplication.gameContext.requireGame())
      .turnOrderManager.getTrackers()
  );
  expect(party.inputLock.isLocked()).toBeTruthy();
}
