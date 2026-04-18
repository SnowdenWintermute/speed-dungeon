import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "@/servers/fixtures/test-connection-endpoint-factories";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "$name reconnection flow",
  ({ clientEndpointFactory }) => {
    // auth and guest versions needed:
    it("reconnection success", async () => {
      console.log("reconnection success test");
      // const hostClient = new TestClient();
      // const hostEndpoint = clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL, {
      //   headers: { cookie: `id=${authSessionIds?.hostAuthSessionId}` },
      // });
      // hostClient.initializeEndpoint(hostEndpoint);
      // await hostClient.connect();

      // const gameHostFullUpdate = await hostClient.sendMessageAndAwaitReplyType(
      //   {
      //     type: ClientIntentType.CreateGame,
      //     data: { gameName: "" as GameName, mode: GameMode.Race },
      //   },
      //   GameStateUpdateType.GameFullUpdate
      // );

      // const gameUpdate = gameHostFullUpdate.data;
      // expect(gameUpdate.game).toBeDefined();
      // invariant(gameUpdate.game !== null);

      // const gameHostLobbyGameListUpdate = await hostClient.sendMessageAndAwaitReplyType(
      //   {
      //     type: ClientIntentType.RequestsGameList,
      //     data: undefined,
      //   },
      //   GameStateUpdateType.GameList
      // );

      // expect(gameHostLobbyGameListUpdate.data.gameList.length).toBe(1);

      // // have someone join
      // const joinerClient = new TestClient();
      // const joinerEndpoint = clientEndpointFactory.createClientEndpoint(TEST_LOBBY_URL, {
      //   headers: { cookie: `id=${authSessionIds?.joinerAuthSessionId}` },
      // });
      // joinerClient.initializeEndpoint(joinerEndpoint);
      // await joinerClient.connect();

      // const hostSeesPlayerJoinedListener = hostClient.awaitGameStateUpdate(
      //   GameStateUpdateType.PlayerJoinedGame
      // );
      // const joinerFullUpdate = await joinerClient.sendMessageAndAwaitReplyType(
      //   {
      //     type: ClientIntentType.JoinGame,
      //     data: { gameName: gameUpdate.game.name },
      //   },
      //   GameStateUpdateType.GameFullUpdate
      // );

      // const joinerGame = joinerFullUpdate.data.game;
      // expect(joinerGame).toBeDefined();
      // invariant(joinerGame !== null);

      // const deserializedJoinerGame = SpeedDungeonGame.fromSerialized(joinerGame);
      // expect(deserializedJoinerGame.getPlayers().size).toBe(2);

      // await hostSeesPlayerJoinedListener;

      // return { hostClient, joinerClient };
    });
  }
);
