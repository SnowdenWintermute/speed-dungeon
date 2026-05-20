import { IntegrationTestFixture } from "@/fixtures/integration-test-fixture";

describe("ironman game mode", () => {
  it("placeholder", () => {});
  const testFixture = new IntegrationTestFixture();

  afterEach(async () => {
    await testFixture.closeAllServers();
  });

  it("account saved run limit", () => {
    // create saved runs up to the limit
    // try to create another run - get error
    // try to join another run - get error
  });

  it("no floor selection", () => {
    // create fresh ironman run
    // try select floor
    // get error
    // starting floor still at 1
  });

  it("any user in run can continue", () => {
    // create fresh run
    // two users, alpha and bravo, in run with characters
    // users leave game
    // alpha user can create lobby game for the run
    // bravo user can create lobby game for the run
    // charlie user can not create lobby game for the run
  });

  it("continued run requires all participants", () => {
    // create continued run with two participants
    // try to ready up - get error
    // second participant joins
    // all users try to ready up - get connection instructions
  });

  it("continued run with changed username", () => {
    // create a saved run with alpha and bravo users
    // alpha change username
    // bravo change username
    // alpha create game for continued run
    // alpha receives "PlayerUsernameUpdated" message for alpha's player
    // bravo join game
    // alpha and bravo receive "PlayerUsernameUpdated" message for bravo's player
  });

  it("continued run no create character", () => {
    // create continued run game
    // try create character
    // get error
    // no character created
  });

  it("fresh run create character", () => {
    // create fresh ironman game
    // try create character
    // character created in default party
  });

  it("floor descent saves records", () => {
    // create fresh ironman game
    // descend floor
    // expect to find saved record in persistence service matching current game state
    //
    // -- the following are shared logic with RankedRace mode: move to a shared mode test suite
    // expect to find saved party time spent on floor record
    // expect to find saved character time spent on floor records
    // expect the time on the floor time records to be correct
    // descend another floor
    // check records for 2nd floor descent to ensure the timers are being reset
  });

  it("game start saves record", () => {
    // create fresh ironman game
    // get connection instructions
    // expect to NOT find record in persistence service yet
    // connect to game server
    // get game time started message
    // expect to find saved record in persistence service m
  });

  it("game leave saves record", () => {
    // create fresh ironman game
    // get connection instructions
    // connect to game server
    // get game time started message
    // expect to find saved record in persistence service matching game state at time of leave
  });

  it("run wipe", () => {
    // create run
    // start game
    // expect users in run have the run id in their profiles
    // wipe
    // expect users in run no longer have the run id in their profiles
    // expect the saved run to no longer exist
  });

  it("run escape", () => {
    // create run
    // start game
    // expect users in run have the run id in their profiles
    // wipe
    // expect users in run no longer have the run id in their profiles
    // expect the saved run to no longer exist
  });
});
