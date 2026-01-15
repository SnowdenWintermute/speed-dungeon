import { describe, it, expect } from "vitest";
import { LobbyServer } from "../index.js";
import { EntityName, GameName, PartyName } from "../../../aliases.js";
import { GameMode } from "../../../types.js";
import { InMemoryTransport } from "../../../transport/in-memory-transport.js";
import { GameListEntry, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { TestHelpers } from "./helpers.test.js";
import { MessageDispatchType } from "../../update-delivery/message-dispatch-factory.js";
import { ConnectionRole } from "../../../http-headers.js";
import { CombatantClass } from "../../../combatants/combatant-class/classes.js";
import { GameServer } from "../../game-server/index.js";
import { GameServerConnectionType } from "../game-handoff/connection-instructions.js";

describe("lobby server", () => {
  let lobbyInMemoryTransport: InMemoryTransport;
  let gameServerInMemoryTransport: InMemoryTransport;
  let lobbyServer: LobbyServer;
  let gameServer: GameServer;

  beforeEach(async () => {
    const inMemoryTransportAndServers = await TestHelpers.createInMemoryTransportWithTestServers();
    lobbyInMemoryTransport = inMemoryTransportAndServers.lobbyInMemoryTransport;
    gameServerInMemoryTransport = inMemoryTransportAndServers.gameServerInMemoryTransport;
    lobbyServer = inMemoryTransportAndServers.lobbyServer;
    gameServer = inMemoryTransportAndServers.gameServer;
  });

  it("game creation", async () => {
    // make a game host
    const { serverEndpoint: serverEndpointForGameHost, clientEndpoint: clientEndpointForGameHost } =
      await lobbyInMemoryTransport.createConnection({ type: ConnectionRole.User });

    const gameHostSession = lobbyServer.userSessionRegistry.getExpectedSession(
      serverEndpointForGameHost.id
    );

    // make another lobby user
    const { serverEndpoint: serverEndpointForOtherInLobby, clientEndpoint: _c2 } =
      await lobbyInMemoryTransport.createConnection({ type: ConnectionRole.User });
    const otherLobbyUserSession = lobbyServer.userSessionRegistry.getExpectedSession(
      serverEndpointForOtherInLobby.id
    );

    const gameName = "my game name" as GameName;

    const gameCreationOutbox = await lobbyServer.gameLifecycleController.createGameHandler(
      { gameName, mode: GameMode.Race },
      gameHostSession
    );

    // game exists with creating player in it
    console.log("about to require game in game creation test");
    const game = lobbyServer.lobbyState.gameRegistry.requireGame(gameName);
    expect(game.name).toEqual(gameName);
    expect(game.getPlayer(gameHostSession.username)).toBeDefined();

    // outbox created with correct messages
    const gameCreationDispatches = gameCreationOutbox.toDispatches();

    // let's other user know the game host left the lobby
    const userLeftLobbyChannel = gameCreationDispatches[0];
    expect(userLeftLobbyChannel).toEqual({
      type: MessageDispatchType.FanOut,
      connectionIds: [otherLobbyUserSession.connectionId],
      message: {
        type: GameStateUpdateType.UserLeftChannel,
        data: { username: gameHostSession.username },
      },
    });

    // gives game host their new game data
    const newGameUpdate = gameCreationDispatches[1];
    expect(newGameUpdate).toEqual({
      type: MessageDispatchType.Single,
      connectionId: gameHostSession.connectionId,
      message: {
        type: GameStateUpdateType.GameFullUpdate,
        data: { game: game.getSerialized() },
      },
    });

    // tell clients already in the game that someone joined, which is no one yet since it was just created
    const playerJoinedGame = gameCreationDispatches[2];
    expect(playerJoinedGame).toEqual({
      type: MessageDispatchType.FanOut,
      connectionIds: [], // empty since no one was in the game yet
      message: {
        type: GameStateUpdateType.PlayerJoinedGame,
        data: { username: gameHostSession.username },
      },
    });

    // @TODO can't create a game while in one (need to create error dispatches)

    // const anotherGameName = "my other game name" as GameName;
    // const secondGameCreationOutbox = await lobbyServer.gameLifecycleController.createGameHandler(
    //   { gameName: anotherGameName, mode: GameMode.Race },
    //   gameHostSession
    // );

    // const secondGameCreationDispatches = secondGameCreationOutbox.toDispatches();

    // const gameCreationError = secondGameCreationDispatches[0];
    // expect(gameCreationError).toEqual({
    //   type: GameStateUpdateDispatchType.Single,
    //   connectionId: otherLobbyUserSession.connectionId,
    //   message: {
    //     type: GameStateUpdateType.GameList,
    //     data: {
    //       gameList: [new GameListEntry(gameName, 1, GameMode.Race, null, false)],
    //     },
    //   },
    // });

    // other lobby user can get new game list and see the newly created game
    const getGameListOutbox =
      lobbyServer.gameLifecycleController.requestGameListHandler(otherLobbyUserSession);
    const getGameListDispatches = getGameListOutbox.toDispatches();

    const gameList = getGameListDispatches[0];
    expect(gameList).toEqual({
      type: MessageDispatchType.Single,
      connectionId: otherLobbyUserSession.connectionId,
      message: {
        type: GameStateUpdateType.GameList,
        data: {
          gameList: [new GameListEntry(gameName, 1, GameMode.Race, null, false)],
        },
      },
    });

    // when another player joins, the host gets a message
    const joinGameOutbox = await lobbyServer.gameLifecycleController.joinGameHandler(
      gameName,
      otherLobbyUserSession
    );
    const joinGameDispatches = joinGameOutbox.toDispatches();

    const secondPlayerJoinedGame = joinGameDispatches[2];
    expect(secondPlayerJoinedGame).toEqual({
      type: MessageDispatchType.FanOut,
      connectionIds: [gameHostSession.connectionId],
      message: {
        type: GameStateUpdateType.PlayerJoinedGame,
        data: { username: otherLobbyUserSession.username },
      },
    });

    const testPartyName = "my test party" as PartyName;

    const gameHostCreatedPartyOutbox = lobbyServer.partySetupController.createPartyHandler(
      gameHostSession,
      testPartyName
    );
    const otherUserJoinedPartyOutbox = lobbyServer.partySetupController.joinPartyHandler(
      otherLobbyUserSession,
      testPartyName
    );

    const gameHostCreatedCharacter =
      lobbyServer.characterLifecycleController.createCharacterHandler(gameHostSession, {
        name: "game host character name" as EntityName,
        combatantClass: CombatantClass.Mage,
      });
    const otherUserCreatedCharacter =
      lobbyServer.characterLifecycleController.createCharacterHandler(otherLobbyUserSession, {
        name: "other user character name" as EntityName,
        combatantClass: CombatantClass.Warrior,
      });

    const gameHostReadiedOutbox =
      await lobbyServer.gameLifecycleController.toggleReadyToStartGameHandler(gameHostSession);
    const otherUserReadiedOutbox =
      await lobbyServer.gameLifecycleController.toggleReadyToStartGameHandler(
        otherLobbyUserSession
      );

    for (const messageDispatch of otherUserReadiedOutbox.toDispatches()) {
      if (
        messageDispatch.type === MessageDispatchType.Single &&
        messageDispatch.message.type === GameStateUpdateType.GameServerConnectionInstructions &&
        messageDispatch.message.data.connectionInstructions.type === GameServerConnectionType.Remote
      ) {
        const token =
          messageDispatch.message.data.connectionInstructions.encryptedSessionClaimToken;
        const {
          serverEndpoint: gameServerConnectionEndpoint,
          clientEndpoint: userConnectionToGameServerEndpoint,
        } = await gameServerInMemoryTransport.createConnection({
          type: ConnectionRole.User,
          encodedGameServerSessionClaimToken: token,
        });
      }
    }

    expect(game.getTimeStarted !== null);
  });
});
