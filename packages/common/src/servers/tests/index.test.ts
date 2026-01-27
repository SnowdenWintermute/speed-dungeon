import { describe, it, expect } from "vitest";
import { LobbyServer } from "../lobby-server/index.js";
import { GameServer } from "../game-server/index.js";
import { TEST_LOBBY_URL } from "./fixtures/index.js";
import { TestClient } from "../../test-utils/test-client.js";
import { ClientIntentType } from "../../packets/client-intents.js";
import { EntityName, GameName, PartyName } from "../../aliases.js";
import { GameStateUpdateType } from "../../packets/game-state-updates.js";
import { invariant } from "../../utils/index.js";
import { GameMode } from "../../types.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { createTestServers } from "./fixtures/create-test-servers.js";
import {
  TEST_CONNECTION_ENDPOINT_FACTORIES,
  ClientEndpointFactory,
} from "./fixtures/test-connection-endpoint-factories.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";

// @TODO
// - pre game start input
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

  it("game handoff", async () => {
    const { hostClient, joinerClient } = await testGameSetupToGameHandoff(clientEndpointFactory);
  });

  it("minimum characters", async () => {
    const { hostClient, joinerClient } =
      await testGameSetupToTwoPlayersInParty(clientEndpointFactory);
    await hostClient.sendMessageAndAwaitReplyType(
      { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
      GameStateUpdateType.ErrorMessage
    );

    await joinerClient.sendMessageAndAwaitReplyType(
      { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
      GameStateUpdateType.ErrorMessage
    );
  });

  it("minimum parties", async () => {
    const { hostClient } = await testGameSetupToTwoPlayersJoined(clientEndpointFactory);

    await hostClient.sendMessageAndAwaitReplyType(
      { type: ClientIntentType.ToggleReadyToStartGame, data: undefined },
      GameStateUpdateType.ErrorMessage
    );
  });
});

async function testGameSetupToTwoPlayersInParty(clientEndpointFactory: ClientEndpointFactory) {
  const { hostClient, joinerClient } = await testGameSetupToTwoPlayersJoined(clientEndpointFactory);

  let partyName = "" as PartyName;
  const hostCreatePartyMessage = await hostClient.sendMessageAndAwaitReplyType(
    { type: ClientIntentType.CreateParty, data: { partyName } },
    GameStateUpdateType.PartyCreated,
    { logMessage: true }
  );
  partyName = hostCreatePartyMessage.data.partyName;

  await joinerClient.sendMessageAndAwaitReplyType(
    { type: ClientIntentType.JoinParty, data: { partyName } },
    GameStateUpdateType.PlayerChangedAdventuringParty,
    { logMessage: true }
  );

  return { hostClient, joinerClient, partyName };
}

async function testGameSetupToGameHandoff(clientEndpointFactory: ClientEndpointFactory) {
  const { hostClient, joinerClient } =
    await testGameSetupToTwoPlayersInPartyWithCharacters(clientEndpointFactory);

  const joinerClientHostReadiedListener = joinerClient.awaitGameStateUpdate(
    GameStateUpdateType.PlayerToggledReadyToStartGame
  );
  await hostClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.ToggleReadyToStartGame,
      data: undefined,
    },
    GameStateUpdateType.PlayerToggledReadyToStartGame
  );

  await joinerClientHostReadiedListener;

  const hostGameHandoffListener = hostClient.awaitGameStateUpdate(
    GameStateUpdateType.GameServerConnectionInstructions
  );
  const joinerGameHandoffListener = joinerClient.awaitGameStateUpdate(
    GameStateUpdateType.GameServerConnectionInstructions
  );

  await joinerClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.ToggleReadyToStartGame,
      data: undefined,
    },
    GameStateUpdateType.PlayerToggledReadyToStartGame
  );

  const handoffMessage = await hostGameHandoffListener;
  await joinerGameHandoffListener;
  console.log("handoffMessage:", handoffMessage);

  return { hostClient, joinerClient };
}

async function testGameSetupToTwoPlayersInPartyWithCharacters(
  clientEndpointFactory: ClientEndpointFactory
) {
  const { hostClient, joinerClient } =
    await testGameSetupToTwoPlayersInParty(clientEndpointFactory);

  await hostClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.CreateCharacter,
      data: { combatantClass: CombatantClass.Warrior, name: "" as EntityName },
    },
    GameStateUpdateType.CharacterAddedToParty
  );

  await joinerClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.CreateCharacter,
      data: { combatantClass: CombatantClass.Mage, name: "" as EntityName },
    },
    GameStateUpdateType.CharacterAddedToParty
  );

  return { hostClient, joinerClient };
}

async function testGameSetupToTwoPlayersJoined(clientEndpointFactory: ClientEndpointFactory) {
  const hostClient = new TestClient();
  const hostEndpoint = clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL);
  hostClient.initializeEndpoint(hostEndpoint);
  await hostClient.connect();

  const gameHostFullUpdate = await hostClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.CreateGame,
      data: { gameName: "" as GameName, mode: GameMode.Race },
    },
    GameStateUpdateType.GameFullUpdate
  );

  const gameUpdate = gameHostFullUpdate.data;
  expect(gameUpdate.game).toBeDefined();
  invariant(gameUpdate.game !== null);

  const gameHostLobbyGameListUpdate = await hostClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.RequestsGameList,
      data: undefined,
    },
    GameStateUpdateType.GameList
  );
  expect(gameHostLobbyGameListUpdate.data.gameList.length).toBe(1);

  // have someone join
  const joinerClient = new TestClient();
  const joinerEndpoint = clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL);
  joinerClient.initializeEndpoint(joinerEndpoint);
  await joinerClient.connect();

  const hostSeesPlayerJoinedListener = hostClient.awaitGameStateUpdate(
    GameStateUpdateType.PlayerJoinedGame
  );
  const joinerFullUpdate = await joinerClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.JoinGame,
      data: { gameName: gameUpdate.game.name },
    },
    GameStateUpdateType.GameFullUpdate
  );

  const joinerGame = joinerFullUpdate.data.game;
  expect(joinerGame).toBeDefined();
  invariant(joinerGame !== null);

  const deserializedJoinerGame = SpeedDungeonGame.getDeserialized(joinerGame);
  expect(deserializedJoinerGame.getPlayers().size).toBe(2);

  await hostSeesPlayerJoinedListener;

  return { hostClient, joinerClient };
}
