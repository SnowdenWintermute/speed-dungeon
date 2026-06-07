import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_CHARACTER_NAME_1,
  TEST_GAME_NAME,
} from "@/fixtures/consts";
import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import {
  CharacterControlScheme,
  CombatActionName,
  CombatantClass,
  GameId,
  GameMode,
  invariant,
  TEST_DUNGEON_TWO_WOLF_ROOMS,
} from "@speed-dungeon/common";
import isEqual from "lodash/isEqual";

describe("ironman game mode", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("continued run preserves combatant state", async () => {
    await testFixture.resetWithOptions(TEST_DUNGEON_TWO_WOLF_ROOMS);
    testFixture.timeMachine.start();
    const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
    await alpha.connect();
    await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
    await alpha.lobbyClientHarness.createCharacter(TEST_CHARACTER_NAME_1, CombatantClass.Warrior);
    await alpha.lobbyClientHarness.toggleReadyToStartGame();
    await alpha.clientApplication.sequentialEventProcessor.waitUntilIdle();
    await alpha.clientApplication.topologyManager.transitionToGameServer.waitFor();

    const game = alpha.clientApplication.gameContext.requireGame();
    const party = alpha.clientApplication.gameContext.requireParty();

    await alpha.gameClientHarness.toggleReadyToExplore();
    await alpha.gameClientHarness.selectCombatAction(CombatActionName.Attack, 1);
    const focusedCharacter = alpha.clientApplication.combatantFocus.requireFocusedCharacter();
    const focusedCharacterHpBeforeAction =
      focusedCharacter.combatantProperties.resources.getHitPoints();
    const currentTargetId = focusedCharacter
      .getTargetingProperties()
      .requireSelectedSingleTargetId();
    const targetCombatant = party.combatantManager.getExpectedCombatant(currentTargetId);
    const targetHpBeforeAttack = targetCombatant.combatantProperties.resources.getHitPoints();
    await alpha.gameClientHarness.useSelectedCombatAction();
    const targetHpAfterAttack = targetCombatant.combatantProperties.resources.getHitPoints();
    const focusedCharacterHpAfterAction =
      focusedCharacter.combatantProperties.resources.getHitPoints();
    expect(targetHpAfterAttack < targetHpBeforeAttack);
    expect(focusedCharacterHpAfterAction < focusedCharacterHpBeforeAction);
    const turnOrderBeforeLeaveGame = party.requireBattle(game).turnOrderManager.getTrackers();

    alpha.clientApplication.gameClientRef.get().leaveGame();
    await alpha.clientApplication.topologyManager.transitionToLobbyServer.waitFor();
    const { savedIronmanRuns } = alpha.clientApplication.lobbyContext;
    const savedRunId = [...savedIronmanRuns.keys()][0];
    invariant(savedRunId !== undefined, "expected a saved ironman run id");
    await alpha.lobbyClientHarness.createGame(
      TEST_GAME_NAME,
      GameMode.Ironman,
      CharacterControlScheme.Captain,
      savedRunId as GameId
    );
    await alpha.lobbyClientHarness.toggleReadyToStartGame();
    const gameAfterGameLoad = alpha.clientApplication.gameContext.requireGame();
    const partyAfterGameLoad = alpha.clientApplication.gameContext.requireParty();
    const targetCombatantInLoadedRun =
      partyAfterGameLoad.combatantManager.getExpectedCombatant(currentTargetId);
    const targetCombatantInLoadedRunHp =
      targetCombatantInLoadedRun.combatantProperties.resources.getHitPoints();
    expect(targetCombatantInLoadedRunHp).toEqual(targetHpAfterAttack);
    const turnOrderInLoadedRun = partyAfterGameLoad
      .requireBattle(gameAfterGameLoad)
      .turnOrderManager.getTrackers();
    const turnTrackersAreEqual = isEqual(turnOrderBeforeLeaveGame, turnOrderInLoadedRun);
    expect(turnTrackersAreEqual).toBeTruthy();
  });

  // it("account saved run limit", async () => {
  //   await testFixture.resetWithOptions();
  //   const alpha = testFixture.createClient("alpha", TEST_AUTH_SESSION_ID_PLAYER_1);
  //   await alpha.connect();
  //   await alpha.lobbyClientHarness.createGame(TEST_GAME_NAME, GameMode.Ironman);
  //   // create saved runs up to the limit
  //   // try to create fresh run - get error
  //   // try to join a run not referenced in their account - get error
  // });

  // it("join/create continued run while at account limit", async () => {
  //   // two users with saved run slots filled
  //   // join a run hosted by another user, but included in their profile
  //   // success
  // });

  // it("continue run from older game version", async () => {
  //   // try to load a run from older game version
  //   // error - old game version
  // });

  // it("no floor selection", async () => {
  //   // create fresh ironman run
  //   // try select floor
  //   // get error
  //   // starting floor still at 1
  // });

  // it("any user in run can continue", async () => {
  //   // create fresh run
  //   // two users, alpha and bravo, in run with characters
  //   // users leave game
  //   // alpha user can create lobby game for the run
  //   // bravo user can create lobby game for the run
  //   // charlie user can not create lobby game for the run
  // });

  // it("two users create same continued run", async () => {
  //   // first user starts a continued run lobby setup
  //   // second user tries to create a game with the same run id
  //   // gets error
  // });

  // it("continued run requires all participants", async () => {
  //   // create continued run with two participants
  //   // try to ready up - get error
  //   // second participant joins
  //   // all users try to ready up - get connection instructions
  // });

  // it("abandon run while other player in lobby setup", () =>{
  // player 1 creates lobby setup for continued run
  // player 2 abandons run
  // player 1 sees characters transfer
  // player 1 can ready up and start game
  // player 1 can control inherited characters
  // })

  // it("continued run can not add characters", async () => {
  //   // create continued Captains run in lobby with only two characters
  //   // users join
  //   // user tries to create character
  //   // error: can not create a new character in a continued ironman run
  // });

  // it("continued run with changed username", async () => {
  //   // create a saved run with alpha and bravo users
  //   // alpha change username
  //   // bravo change username
  //   // alpha create game for continued run
  //   // alpha receives "PlayerUsernameUpdated" message for alpha's player
  //   // bravo join game
  //   // alpha and bravo receive "PlayerUsernameUpdated" message for bravo's player
  //   // users ready up
  //   // users receive game server connection instructions
  // });

  // it("fresh run create character", async () => {
  //   // create fresh ironman game
  //   // try create character
  //   // character created in default party
  // });

  // it("floor descent saves records", async () => {
  //   // create fresh ironman game
  //   // descend floor
  //   // expect to find saved record in persistence service matching current game state
  //   //
  //   // -- the following are shared logic with RankedRace mode: move to a shared mode test suite
  //   // expect to find saved party time spent on floor record
  //   // expect to find saved character time spent on floor records
  //   // expect the time on the floor time records to be correct
  //   // descend another floor
  //   // check records for 2nd floor descent to ensure the timers are being reset
  // });

  // it("floor descent in continued run", async () => {
  //   // - create fresh ironman game
  //   // - spend some time on first floor
  //   // - create continued ironman game
  //   // - descend floor
  //   // - expect time spent on floor records to reflect time spent
  //   //   in original game instance plus time spent in loaded instance
  //   //
  // });

  // it("game start saves record", async () => {
  //   // create fresh ironman game
  //   // get connection instructions
  //   // expect to NOT find record in persistence service yet
  //   // connect to game server
  //   // get game time started message
  //   // expect to find saved record in persistence service m
  // });

  // it("game leave saves record", async () => {
  //   // create fresh ironman game
  //   // get connection instructions
  //   // connect to game server
  //   // get game time started message
  //   // leave game
  //   // expect to find saved record in persistence service matching game state at time of leave
  // });

  // it("run wipe", async () => {
  //   // create run
  //   // start game
  //   // expect users in run have the run id in their profiles
  //   // wipe
  //   // expect users in run no longer have the run id in their profiles
  //   // expect the saved run to no longer exist
  //   // expect the party fate to be "Wiped" in the party record
  // });

  // it("run escape", async () => {
  //   // create run
  //   // start game
  //   // expect users in run have the run id in their profiles
  //   // escape
  //   // expect users in run no longer have the run id in their profiles
  //   // expect the saved run to no longer exist
  //   // expect the party fate to be "Escaped" in the party record
  // });

  // it("player leaving closes game", async () => {
  //   // two players in an ironman run
  //   // one player leaves
  //   // other player gets "player left run" message
  //   // other player's client disconnects from game server
  //   // other player's client connects to lobby server
  // });

  // it("abandon run with captains control scheme", async () => {
  //   // - create run with join order alpha:first, bravo:second, charlie:third
  //   // - user bravo sends "abondon ironman run" client intent
  //   // - get error: can't abandon a live run
  //   // - players leave the game
  //   // - bravo's client sees a filled ironman run slot
  //   // - user bravo sends "abondon ironman run" client intent
  //   // - user bravo's client all ironman run slots empty/available
  //   // - ironman run record shows their player no longer in the run
  //   // - ironman run record shows all characters owned by user alpha's player
  //   // - user alpha sends "abondon ironman run" client intent
  //   // - ironman run record shows all characters owned by user charlie's player
  //   // - user charlie sends "abondon ironman run" client intent
  //   // - run record no longer exists
  //   // - expect the party fate to be "Wiped" in the record
  // });

  // it("abandon run with freelancers control scheme", async () => {
  //   // convert run to captains control scheme
  //   // follow the flow of transferring characters
  // });

  // it("abandon unowned run", async () => {
  //   // create saved run with alpha user
  //   // bravo user tries to abandon the run
  //   // error: you are not in that run
  // });

  // it("reconnect to closed run", async () => {
  //   // - player disconnects from ironman run
  //   // - other player in run intentionally leaves
  //   // - live game no longer exists
  //   // - disconnected player connects to lobby
  //   // - no reconnection instructions received by player's client
  // });
});
