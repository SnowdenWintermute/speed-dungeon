import {
  GameServer,
  LobbyServer,
  TEST_DUNGEON_SIMPLE,
  TEST_DUNGEON_TWO_SPIDER_ROOMS,
} from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { TimeMachine } from "../test-utils/time-machine.js";
import { enterTestGameSingleCharacter } from "@/fixtures/enter-test-game-single-character.js";
import { testLeaveAndCreateNewGame } from "./test-leave-and-create-new-game.js";
import { IntegrationTestFixture } from "@/types.js";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "experiment with new architecture",
  ({ clientEndpointFactory }) => {
    let testFixture: IntegrationTestFixture;
    const timeMachine = new TimeMachine();

    beforeEach(async () => {});

    afterEach(async () => {
      testFixture.lobbyServer.closeTransportServer();
      testFixture.gameServer.closeTransportServer();
      timeMachine.returnToPresent();
    });

    it("combat action", async () => {
      const setup = await enterTestGameSingleCharacter(
        clientEndpointFactory,
        timeMachine,
        "game 1",
        TEST_DUNGEON_SIMPLE
      );
      testFixture = { ...testFixture, ...setup };
      await testLeaveAndCreateNewGame(testFixture);
    });

    it("combat action2", async () => {
      const setup = await enterTestGameSingleCharacter(
        clientEndpointFactory,
        timeMachine,
        "game 1",
        TEST_DUNGEON_TWO_SPIDER_ROOMS
      );
      testFixture = { ...testFixture, ...setup };
      // await testLeaveAndCreateNewGame(testFixture);
    });
  }
);
