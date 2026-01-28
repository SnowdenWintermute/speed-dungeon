import { describe, it, expect } from "vitest";
import { LobbyServer } from "../lobby-server/index.js";
import { GameServer } from "../game-server/index.js";
import { ClientIntentType } from "../../packets/client-intents.js";
import { GameStateUpdateType } from "../../packets/game-state-updates.js";
import { createTestServers } from "./fixtures/create-test-servers.js";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "./fixtures/test-connection-endpoint-factories.js";
import { testGameSetupToTwoPlayersInParty } from "./fixtures/checkpoints/two-players-in-party.js";
import { testGameSetupToGameHandoff } from "./fixtures/checkpoints/game-handoff.js";
import { QUERY_PARAMS } from "../query-params.js";
import { testGameSetupToHostJoinedGameServer } from "./fixtures/checkpoints/host-joined-game-server.js";
import { testGameSetupToBothPlayersJoined } from "./fixtures/checkpoints/two-players-joined-game-server.js";

// @TODO
// - pre game start input
//
// - input while awaiting reconnect
// - input after timeout
// - input after reconnect
// - reconnect after timeout
// - session claim token
// - session claim token reuse
// - reconnect token reuse
// -

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)("$name lobby server", (clientEndpointFactory) => {
  let lobbyServer: LobbyServer;
  let gameServer: GameServer;

  beforeEach(async () => {
    const { lobbyIncomingConnectionGateway, gameServerIncomingConnectionGateway } =
      clientEndpointFactory.createIncomingConnectionGateways();

    const inMemoryTransportAndServers = await createTestServers(
      lobbyIncomingConnectionGateway,
      gameServerIncomingConnectionGateway
    );
    lobbyServer = inMemoryTransportAndServers.lobbyServer;
    gameServer = inMemoryTransportAndServers.gameServer;
  });

  afterEach(async () => {
    await new Promise((resolve) => setImmediate(resolve));
    lobbyServer.closeTransportServer();
    gameServer.closeTransportServer();
  });

  it("input after reconnect", async () => {
    const { hostClient, joinerClient } =
      await testGameSetupToBothPlayersJoined(clientEndpointFactory);
    //
  });

  // it("input before game start", async () => {
  //   const { hostClient } = await testGameSetupToHostJoinedGameServer(clientEndpointFactory);
  //   // don't allow input before all players are in game
  //   await hostClient.sendMessageAndAwaitReplyType(
  //     {
  //       type: ClientIntentType.ToggleReadyToExplore,
  //       data: undefined,
  //     },
  //     GameStateUpdateType.ErrorMessage
  //   );
  // });

  // it("minimum characters", async () => {
  //   const { hostClient, joinerClient } =
  //     await testGameSetupToTwoPlayersInParty(clientEndpointFactory);
  //   await hostClient.sendMessageAndAwaitReplyType(
  //     { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
  //     GameStateUpdateType.ErrorMessage
  //   );

  //   await joinerClient.sendMessageAndAwaitReplyType(
  //     { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
  //     GameStateUpdateType.ErrorMessage
  //   );

  //   await hostClient.close();
  //   await joinerClient.close();
  // });

  // it("minimum parties", async () => {
  //   const { hostClient, joinerClient } =
  //     await testGameSetupToTwoPlayersJoined(clientEndpointFactory);

  //   await hostClient.sendMessageAndAwaitReplyType(
  //     { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
  //     GameStateUpdateType.ErrorMessage
  //   );

  //   await hostClient.close();
  //   await joinerClient.close();
  // });
});
