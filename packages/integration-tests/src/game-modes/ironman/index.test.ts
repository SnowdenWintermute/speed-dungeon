import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";
import { testContinuedRunPreservesState } from "./continued-run-preserves-state";
import {
  testAccountSavedIronmanRunLimitGameCreate,
  testAccountSavedIronmanRunLimitGameJoin,
} from "./account-saved-run-limit";
import { testJoinContinuedRunAsNonParticipant } from "./join-continued-run-as-non-participant";
import { testAnyParticipantMayContinueRun } from "./any-participant-may-continue-run";
import { testOneGameSetupPerContinuedRun } from "./one-game-setup-per-continued-run";
import { testNoFloorSelection } from "./no-floor-selection";
import { testContinuedRunAddCharacterForbidden } from "./continued-run-add-character-forbidden";
import { testContinuedRunRemoveCharacterForbidden } from "./continued-run-remove-character-forbidden";
import { testContinuedRunSetupAwaitsAllParticipants } from "./continued-run-setup-awaits-all-participants";
import { testFreshRunCreateCharacter } from "./fresh-run-create-character";
import { testContinuedRunAfterUsernameChange } from "./continued-run-changed-username";

describe("ironman game mode", () => {
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("continued run preserves combatant state", async () => {
    await testContinuedRunPreservesState(testFixture);
  });

  it("create run at account saved run limit", async () => {
    await testAccountSavedIronmanRunLimitGameCreate(testFixture);
  });

  it("join continued run while at account limit", async () => {
    await testAccountSavedIronmanRunLimitGameJoin(testFixture);
  });

  it("attempt join continued run as non participant", async () => {
    await testJoinContinuedRunAsNonParticipant(testFixture);
  });

  it("any participant can continue run", async () => {
    await testAnyParticipantMayContinueRun(testFixture);
  });

  it("one game setup per continued run", async () => {
    await testOneGameSetupPerContinuedRun(testFixture);
  });

  it("no floor selection", async () => {
    await testNoFloorSelection(testFixture);
  });

  it("fresh run create character", async () => {
    await testFreshRunCreateCharacter(testFixture);
  });

  it("continued run can not add characters", async () => {
    await testContinuedRunAddCharacterForbidden(testFixture);
  });

  it("continued run can not remove characters", async () => {
    await testContinuedRunRemoveCharacterForbidden(testFixture);
  });

  it("continued run requires all participants", async () => {
    await testContinuedRunSetupAwaitsAllParticipants(testFixture);
  });

  it("continued run with changed username", async () => {
    await testContinuedRunAfterUsernameChange(testFixture);
  });

  // it("abandon run while other player in lobby setup", () =>{
  // player 1 creates lobby setup for continued run
  // player 2 abandons run
  // player 1 sees characters transfer
  // player 1 can ready up and start game
  // player 1 can control inherited characters
  // })

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

  // it("time spent on floor in continued run", async () => {
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
