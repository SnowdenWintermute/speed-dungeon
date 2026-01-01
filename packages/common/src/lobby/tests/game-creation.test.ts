import { describe, it, expect } from "vitest";
import { Lobby } from "../index.js";
import { GameName } from "../../aliases.js";
import { GameMode } from "../../types.js";
import { InMemoryTransport } from "../../transport/in-memory-transport.js";
import { GameStateUpdateDispatchType } from "../update-delivery/game-state-update-dispatch-factory.js";
import { GameListEntry, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { TestHelpers } from "./helpers.js";

describe("Lobby", () => {
  let inMemoryTransport: InMemoryTransport;
  let lobby: Lobby;

  beforeEach(() => {
    const inMemoryTransportWithTestLobby = TestHelpers.createInMemoryTransportWithTestLobby();
    inMemoryTransport = inMemoryTransportWithTestLobby.inMemoryTransport;
    lobby = inMemoryTransportWithTestLobby.lobby;
  });

  it("game creation", async () => {
    // make a game host
    const { serverEndpoint: serverEndpointForGameHost, clientEndpoint: _c1 } =
      await inMemoryTransport.createConnection();
    const gameHostSession = lobby.userSessionRegistry.getExpectedSession(
      serverEndpointForGameHost.id
    );

    // make another lobby user
    const { serverEndpoint: serverEndpointForOtherInLobby, clientEndpoint: _c2 } =
      await inMemoryTransport.createConnection();
    const otherLobbyUserSession = lobby.userSessionRegistry.getExpectedSession(
      serverEndpointForOtherInLobby.id
    );

    const gameName = "my game name" as GameName;
    const gameCreationOutbox = await lobby.gameLifecycleController.createGameHandler(
      { gameName, mode: GameMode.Race },
      gameHostSession
    );

    // game exists with creating player in it
    const game = lobby.lobbyState.getExpectedGame(gameName);
    expect(game.name).toEqual(gameName);
    expect(game.players[gameHostSession.username]).toBeDefined();

    // outbox created with correct messages
    const gameCreationDispatches = gameCreationOutbox.toDispatches();

    // let's other user know the game host left the lobby
    const userLeftLobbyChannel = gameCreationDispatches[0];
    expect(userLeftLobbyChannel).toEqual({
      type: GameStateUpdateDispatchType.FanOut,
      connectionIds: [otherLobbyUserSession.connectionId],
      update: {
        type: GameStateUpdateType.UserLeftChannel,
        data: { username: gameHostSession.username },
      },
    });

    // gives game host their new game data
    const newGameUpdate = gameCreationDispatches[1];
    expect(newGameUpdate).toEqual({
      type: GameStateUpdateDispatchType.Single,
      connectionId: gameHostSession.connectionId,
      update: {
        type: GameStateUpdateType.GameFullUpdate,
        data: { game: game.getSerialized() },
      },
    });

    // tell clients already in the game that someone joined, which is no one yet since it was just created
    const playerJoinedGame = gameCreationDispatches[2];
    expect(playerJoinedGame).toEqual({
      type: GameStateUpdateDispatchType.FanOut,
      connectionIds: [], // empty since no one was in the game yet
      update: {
        type: GameStateUpdateType.PlayerJoinedGame,
        data: { username: gameHostSession.username },
      },
    });

    // other lobby user can get new game list and see the newly created game
    const getGameListOutbox =
      lobby.gameLifecycleController.requestGameListHandler(otherLobbyUserSession);
    const getGameListDispatches = getGameListOutbox.toDispatches();

    const gameList = getGameListDispatches[0];
    expect(gameList).toEqual({
      type: GameStateUpdateDispatchType.Single,
      connectionId: otherLobbyUserSession.connectionId,
      update: {
        type: GameStateUpdateType.GameList,
        data: {
          gameList: [new GameListEntry(gameName, 1, GameMode.Race, null, false)],
        },
      },
    });

    // when another player joins, the host gets a message
    const joinGameOutbox = await lobby.gameLifecycleController.joinGameHandler(
      gameName,
      otherLobbyUserSession
    );
    const joinGameDispatches = joinGameOutbox.toDispatches();

    const secondPlayerJoinedGame = joinGameDispatches[2];
    expect(secondPlayerJoinedGame).toEqual({
      type: GameStateUpdateDispatchType.FanOut,
      connectionIds: [gameHostSession.connectionId],
      update: {
        type: GameStateUpdateType.PlayerJoinedGame,
        data: { username: otherLobbyUserSession.username },
      },
    });
  });
});
