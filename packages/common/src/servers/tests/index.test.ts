import { describe, it, expect } from "vitest";
import { LobbyServer } from "../lobby-server/index.js";
import { GameServer } from "../game-server/index.js";
import { ClientIntentType } from "../../packets/client-intents.js";
import { GameStateUpdateType } from "../../packets/game-state-updates.js";
import { createTestServers } from "./fixtures/create-test-servers.js";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "./fixtures/test-connection-endpoint-factories.js";
import { testGameSetupToBothPlayersJoined } from "./fixtures/checkpoints/two-players-joined-game-server.js";
import { TimeMachine } from "../../test-utils/time-machine.js";
import { RECONNECTION_OPPORTUNITY_TIMEOUT_MS } from "../game-server/reconnection/index.js";
import { testGameSetupToHostJoinedGameServer } from "./fixtures/checkpoints/host-joined-game-server.js";
import { testGameSetupToTwoPlayersInParty } from "./fixtures/checkpoints/two-players-in-party.js";
import { testGameSetupToTwoPlayersJoinedLobbyGame } from "./fixtures/checkpoints/two-players-joined-lobby-game.js";
import { testGameSetupToSuccessfulGameReconnect } from "./fixtures/checkpoints/successful-game-reconnect.js";
import { invariant } from "../../utils/index.js";
import { QUERY_PARAMS } from "../query-params.js";
import { TEST_LOBBY_URL } from "./fixtures/index.js";
import { testGameSetupToGameHandoff } from "./fixtures/checkpoints/game-handoff.js";

// @TODO
// - pre game start input
// - input while awaiting reconnect
// - input after timeout
// - input after reconnect
// - reconnect after timeout
// - session claim token required
//
// - session claim token reuse
// - reconnect token reuse
// -

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "$name reconnection flow",
  (clientEndpointFactory) => {
    let lobbyServer: LobbyServer;
    let gameServer: GameServer;
    const timeMachine = new TimeMachine();

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
      lobbyServer.closeTransportServer();
      gameServer.closeTransportServer();
      timeMachine.returnToPresent();
    });

    it("session claim token required", async () => {
      const { hostClient, hostConnectionInstructions } =
        await testGameSetupToGameHandoff(clientEndpointFactory);

      hostConnectionInstructions.encryptedSessionClaimToken = "";

      const queryParams = {
        name: QUERY_PARAMS.SESSION_CLAIM_TOKEN,
        value: "",
      };

      const endpoint = clientEndpointFactory.createClientEndpoint(hostConnectionInstructions.url, {
        queryParams: [queryParams],
      });

      hostClient.initializeEndpoint(endpoint);
      await expect(hostClient.connect()).rejects.toThrow();
    });

    // it("reconnect after timeout", async () => {
    //   timeMachine.start();
    //   const { joinerClient } = await testGameSetupToBothPlayersJoined(clientEndpointFactory);

    //   await joinerClient.close();

    //   timeMachine.advanceTime(RECONNECTION_OPPORTUNITY_TIMEOUT_MS);

    //   invariant(joinerClient.guestReconnectionToken !== null);

    //   const joinerRejoinLobbyParams = {
    //     name: QUERY_PARAMS.GUEST_RECONNECTION_TOKEN,
    //     value: joinerClient.guestReconnectionToken as unknown as string,
    //   };

    //   joinerClient.initializeEndpoint(
    //     clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL, {
    //       queryParams: [joinerRejoinLobbyParams],
    //     })
    //   );

    //   const joinerClientInitialJoinUsernameMessageListener = joinerClient.awaitGameStateUpdate(
    //     GameStateUpdateType.OnConnection,
    //     { expiredReconnection: true }
    //   );

    //   const joinerClientInitialJoinUsernameMessage =
    //     await joinerClientInitialJoinUsernameMessageListener;
    //   expect(joinerClientInitialJoinUsernameMessage.data.username).toBeDefined();
    // });

    // it("input after reconnect", async () => {
    //   const { hostClient } = await testGameSetupToSuccessfulGameReconnect(clientEndpointFactory);

    //   await hostClient.sendMessageAndAwaitReplyType(
    //     {
    //       type: ClientIntentType.ToggleReadyToExplore,
    //       data: undefined,
    //     },
    //     GameStateUpdateType.PlayerToggledReadyToDescendOrExplore
    //   );
    // });

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

    // it("input while awaiting reconnect", async () => {
    //   const { hostClient, joinerClient } =
    //     await testGameSetupToBothPlayersJoined(clientEndpointFactory);
    //   await hostClient.close();

    //   joinerClient.sendMessageAndAwaitReplyType(
    //     {
    //       type: ClientIntentType.ToggleReadyToExplore,
    //       data: undefined,
    //     },
    //     GameStateUpdateType.ErrorMessage
    //   );
    // });

    // it("input after reconnect timeout", async () => {
    //   timeMachine.start();
    //   const { hostClient, joinerClient } =
    //     await testGameSetupToBothPlayersJoined(clientEndpointFactory);

    //   await joinerClient.close();

    //   timeMachine.advanceTime(RECONNECTION_OPPORTUNITY_TIMEOUT_MS);

    //   const message = await hostClient.sendMessageAndAwaitReplyType(
    //     {
    //       type: ClientIntentType.ToggleReadyToExplore,
    //       data: undefined,
    //     },
    //     GameStateUpdateType.PlayerToggledReadyToDescendOrExplore
    //   );

    //   expect(message.type).toBe(GameStateUpdateType.PlayerToggledReadyToDescendOrExplore);
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
    //     await testGameSetupToTwoPlayersJoinedLobbyGame(clientEndpointFactory);

    //   await hostClient.sendMessageAndAwaitReplyType(
    //     { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
    //     GameStateUpdateType.ErrorMessage
    //   );

    //   await hostClient.close();
    //   await joinerClient.close();
    // });
  }
);
