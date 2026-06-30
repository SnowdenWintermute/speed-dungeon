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
import { testAbandonRunWhileUserInGameSetup } from "./abandon-run-while-in-game-setup";
import { testAbandonRunWhileOtherUserInLobbySetup } from "./abandon-run-while-other-user-in-game-setup";
import { testAbandonRunDeletion } from "./abandoned-run-deletion";
import { testSaveRunOnGameStart } from "./save-run-on-game-start";
import { testSaveRunOnGameLeave } from "./save-run-on-game-leave";
import { testSaveRunOnFloorDescent } from "./save-run-on-floor-descent";
import { testContinuedRunTimeSpentOnFloor } from "./continued-run-time-spent-on-floor";
import { testIronmanRunWipe } from "./run-wipe";
import { testIronmanRunEscape } from "./run-escape";
import { testPlayerLeavingClosesIronmanGame } from "./player-leaving-closes-game";
import { testAbandonLiveIronmanRun } from "./abandon-live-run";
import { testAbandonIronmanRunFreesSlot } from "./abandon-run-frees-slot";
import { testAbandoningIronmanRunUpdatesLadderRecords } from "./abandon-run-updates-ladder-records";
import { testCharacterTransferAfterAbandonedIronmanRun } from "./abandon-run-character-transfer";

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

  it("game start saves record", async () => {
    await testSaveRunOnGameStart(testFixture);
  });

  it("game leave saves record", async () => {
    await testSaveRunOnGameLeave(testFixture);
  });

  it("descend floor saves record", async () => {
    await testSaveRunOnFloorDescent(testFixture);
  });

  it("time spent on floor in continued run", async () => {
    await testContinuedRunTimeSpentOnFloor(testFixture);
  });

  it("run wipe", async () => {
    await testIronmanRunWipe(testFixture);
  });

  it("run escape", async () => {
    await testIronmanRunEscape(testFixture);
  });

  it("player leaving closes game", async () => {
    await testPlayerLeavingClosesIronmanGame(testFixture);
  });

  it("abandon live run prohibited", async () => {
    await testAbandonLiveIronmanRun(testFixture);
  });

  it("abandon run while other player in lobby setup", async () => {
    await testAbandonRunWhileOtherUserInLobbySetup(testFixture);
  });

  it("host abandon run in lobby setup", async () => {
    await testAbandonRunWhileUserInGameSetup(testFixture);
  });

  it("abandoning run frees slot", async () => {
    await testAbandonIronmanRunFreesSlot(testFixture);
  });

  it("abandoning run updates ladder records", async () => {
    await testAbandoningIronmanRunUpdatesLadderRecords(testFixture);
  });

  it("last player abandoning run deletes it", async () => {
    await testAbandonRunDeletion(testFixture);
  });

  it("abandon run character transfer", async () => {
    await testCharacterTransferAfterAbandonedIronmanRun(testFixture);
  });

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
