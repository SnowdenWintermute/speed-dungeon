// test in memory connection
import {
  ClientIntentType,
  createTestServers,
  GameMode,
  GameName,
  GameStateUpdateType,
  inMemoryFactory,
  TEST_LOBBY_URL,
  TestClient,
} from "@speed-dungeon/common";

const { lobbyIncomingConnectionGateway, gameServerIncomingConnectionGateway } =
  inMemoryFactory.createIncomingConnectionGateways();

const inMemoryTransportAndServers = await createTestServers(
  lobbyIncomingConnectionGateway,
  gameServerIncomingConnectionGateway
);
const lobbyServer = inMemoryTransportAndServers.lobbyServer;
const gameServer = inMemoryTransportAndServers.gameServer;

doesInMemoryTransportWorkOnClient();

export async function doesInMemoryTransportWorkOnClient() {
  const hostClient = new TestClient();
  const hostEndpoint = inMemoryFactory.createClientEndpoint(TEST_LOBBY_URL);
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

  const gameHostLobbyGameListUpdate = await hostClient.sendMessageAndAwaitReplyType(
    {
      type: ClientIntentType.RequestsGameList,
      data: undefined,
    },
    GameStateUpdateType.GameList,
    { logMessage: true }
  );
}
