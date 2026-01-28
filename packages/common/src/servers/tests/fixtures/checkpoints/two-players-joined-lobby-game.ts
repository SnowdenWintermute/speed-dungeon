import { GameName } from "../../../../aliases.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { ClientIntentType } from "../../../../packets/client-intents.js";
import { GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { TestClient } from "../../../../test-utils/test-client.js";
import { GameMode } from "../../../../types.js";
import { invariant } from "../../../../utils/index.js";
import { TEST_LOBBY_URL } from "../index.js";
import { ClientEndpointFactory } from "../test-connection-endpoint-factories.js";

export async function testGameSetupToTwoPlayersJoinedLobbyGame(
  clientEndpointFactory: ClientEndpointFactory
) {
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
