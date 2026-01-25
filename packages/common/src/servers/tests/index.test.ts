import { describe, it, expect } from "vitest";
import { LobbyServer } from "../lobby-server/index.js";
import { GameServer } from "../game-server/index.js";
import { TestHelpers } from "./fixtures/index.js";
import { ConnectionRole } from "../../http-headers.js";
import { EntityName, GameName, PartyName } from "../../aliases.js";
import { GameMode } from "../../types.js";
import { MessageDispatchType } from "../update-delivery/message-dispatch-factory.js";
import {
  GameListEntry,
  GameStateUpdate,
  GameStateUpdateType,
} from "../../packets/game-state-updates.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { ClientIntent } from "../../packets/client-intents.js";

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

// describe("lobby server", () => {
//   let lobbyInMemoryTransport: InMemoryTransport;
//   let gameServerInMemoryTransport: InMemoryTransport;
//   let lobbyServer: LobbyServer;
//   let gameServer: GameServer;

//   beforeEach(async () => {
//     const inMemoryTransportAndServers = await TestHelpers.createInMemoryTransportWithTestServers();
//     lobbyInMemoryTransport = inMemoryTransportAndServers.lobbyInMemoryTransport;
//     gameServerInMemoryTransport = inMemoryTransportAndServers.gameServerInMemoryTransport;
//     lobbyServer = inMemoryTransportAndServers.lobbyServer;
//     gameServer = inMemoryTransportAndServers.gameServer;
//   });

//   it("game creation", async () => {
//     // make a game host
//     const {
//       serverEndpoint: serverEndpointForGameHost,
//       clientEndpoint: clientEndpointForGameHost,
//       open: openGameHostConnectionToLobby,
//     } = await lobbyInMemoryTransport.createConnection({ type: ConnectionRole.User });

//     await openGameHostConnectionToLobby();

//     const gameHostSession = lobbyServer.userSessionRegistry.getExpectedSession(
//       serverEndpointForGameHost.id
//     );

//     // make another lobby user
//     const {
//       serverEndpoint: serverEndpointForOtherInLobby,
//       clientEndpoint: clientEndpointForOtherInLobby,

//       open: openGameJoinerConnectionToLobby,
//     } = await lobbyInMemoryTransport.createConnection({ type: ConnectionRole.User });
//     await openGameJoinerConnectionToLobby();

//     const otherLobbyUserSession = lobbyServer.userSessionRegistry.getExpectedSession(
//       serverEndpointForOtherInLobby.id
//     );

//     const gameName = "DarkSphere" as GameName;

//     const gameCreationOutbox = await lobbyServer.gameLifecycleController.createGameHandler(
//       { gameName, mode: GameMode.Race },
//       gameHostSession
//     );

//     // game exists with creating player in it
//     const game = lobbyServer.lobbyState.gameRegistry.requireGame(gameName);
//     expect(game.name).toEqual(gameName);
//     expect(game.getPlayer(gameHostSession.username)).toBeDefined();

//     // outbox created with correct messages
//     const gameCreationDispatches = gameCreationOutbox.toDispatches();

//     // let's other user know the game host left the lobby
//     const userLeftLobbyChannel = gameCreationDispatches[0];
//     expect(userLeftLobbyChannel).toEqual({
//       type: MessageDispatchType.FanOut,
//       connectionIds: [otherLobbyUserSession.connectionId],
//       message: {
//         type: GameStateUpdateType.UserLeftChannel,
//         data: { username: gameHostSession.username },
//       },
//     });

//     // gives game host their new game data
//     const newGameUpdate = gameCreationDispatches[1];
//     expect(newGameUpdate).toEqual({
//       type: MessageDispatchType.Single,
//       connectionId: gameHostSession.connectionId,
//       message: {
//         type: GameStateUpdateType.GameFullUpdate,
//         data: { game: game.getSerialized() },
//       },
//     });

//     // tell clients already in the game that someone joined, which is no one yet since it was just created
//     const playerJoinedGame = gameCreationDispatches[2];
//     expect(playerJoinedGame).toEqual({
//       type: MessageDispatchType.FanOut,
//       connectionIds: [], // empty since no one was in the game yet
//       message: {
//         type: GameStateUpdateType.PlayerJoinedGame,
//         data: { username: gameHostSession.username },
//       },
//     });

//     // @TODO can't create a game while in one (need to create error dispatches)

//     // const anotherGameName = "my other game name" as GameName;
//     // const secondGameCreationOutbox = await lobbyServer.gameLifecycleController.createGameHandler(
//     //   { gameName: anotherGameName, mode: GameMode.Race },
//     //   gameHostSession
//     // );

//     // const secondGameCreationDispatches = secondGameCreationOutbox.toDispatches();

//     // const gameCreationError = secondGameCreationDispatches[0];
//     // expect(gameCreationError).toEqual({
//     //   type: GameStateUpdateDispatchType.Single,
//     //   connectionId: otherLobbyUserSession.connectionId,
//     //   message: {
//     //     type: GameStateUpdateType.GameList,
//     //     data: {
//     //       gameList: [new GameListEntry(gameName, 1, GameMode.Race, null, false)],
//     //     },
//     //   },
//     // });

//     // other lobby user can get new game list and see the newly created game
//     const getGameListOutbox =
//       lobbyServer.gameLifecycleController.requestGameListHandler(otherLobbyUserSession);
//     const getGameListDispatches = getGameListOutbox.toDispatches();

//     const gameList = getGameListDispatches[0];
//     expect(gameList).toEqual({
//       type: MessageDispatchType.Single,
//       connectionId: otherLobbyUserSession.connectionId,
//       message: {
//         type: GameStateUpdateType.GameList,
//         data: {
//           gameList: [new GameListEntry(gameName, 1, GameMode.Race, null, false)],
//         },
//       },
//     });

//     // when another player joins, the host gets a message
//     const joinGameOutbox = await lobbyServer.gameLifecycleController.joinGameHandler(
//       gameName,
//       otherLobbyUserSession
//     );
//     const joinGameDispatches = joinGameOutbox.toDispatches();

//     const secondPlayerJoinedGame = joinGameDispatches[2];
//     expect(secondPlayerJoinedGame).toEqual({
//       type: MessageDispatchType.FanOut,
//       connectionIds: [gameHostSession.connectionId],
//       message: {
//         type: GameStateUpdateType.PlayerJoinedGame,
//         data: { username: otherLobbyUserSession.username },
//       },
//     });

//     const testPartyName = "my test party" as PartyName;

//     const gameHostCreatedPartyOutbox = lobbyServer.partySetupController.createPartyHandler(
//       gameHostSession,
//       testPartyName
//     );
//     const otherUserJoinedPartyOutbox = lobbyServer.partySetupController.joinPartyHandler(
//       otherLobbyUserSession,
//       testPartyName
//     );

//     const gameHostCreatedCharacter =
//       lobbyServer.characterLifecycleController.createCharacterHandler(gameHostSession, {
//         name: "game host character name" as EntityName,
//         combatantClass: CombatantClass.Mage,
//       });
//     const otherUserCreatedCharacter =
//       lobbyServer.characterLifecycleController.createCharacterHandler(otherLobbyUserSession, {
//         name: "other user character name" as EntityName,
//         combatantClass: CombatantClass.Warrior,
//       });

//     const gameHostReadiedOutbox =
//       await lobbyServer.gameLifecycleController.toggleReadyToStartGameHandler(gameHostSession);
//     const otherUserReadiedOutbox =
//       await lobbyServer.gameLifecycleController.toggleReadyToStartGameHandler(
//         otherLobbyUserSession
//       );

//     // they both leave the lobby to go to game server
//     await clientEndpointForGameHost.close();
//     await clientEndpointForOtherInLobby.close();

//     let someUserInGameConnection;
//     let someUserReconnectionToken;
//     for (const messageDispatch of otherUserReadiedOutbox.toDispatches()) {
//       if (
//         messageDispatch.type === MessageDispatchType.Single &&
//         messageDispatch.message.type === GameStateUpdateType.GameServerConnectionInstructions
//       ) {
//         const token =
//           messageDispatch.message.data.connectionInstructions.encryptedSessionClaimToken;
//         const {
//           serverEndpoint: gameServerConnectionEndpoint,
//           clientEndpoint: userConnectionToGameServerEndpoint,
//           open: openConnectionToGameServer,
//         } = await gameServerInMemoryTransport.createConnection({
//           type: ConnectionRole.User,
//           encodedGameServerSessionClaimToken: token,
//         });

//         const typedEndpoint = userConnectionToGameServerEndpoint.toTyped<
//           ClientIntent,
//           GameStateUpdate
//         >();

//         typedEndpoint.subscribeAll(
//           (someEvent) => {
//             if (someEvent.type === GameStateUpdateType.CacheGuestSessionReconnectionToken) {
//               someUserReconnectionToken = someEvent.data.token;
//             }
//           },
//           async (reason) => {
//             // fake test client disconnected
//           }
//         );

//         await openConnectionToGameServer();

//         someUserInGameConnection = userConnectionToGameServerEndpoint;
//       }
//     }

//     expect(game.getTimeStarted !== null).toBeTruthy();
//     expect(game.inputLock.isLocked).toBeFalsy();

//     await someUserInGameConnection?.close();

//     const {
//       serverEndpoint: reconnectingUserLobbyConnectionEndpoint,
//       clientEndpoint: reconnectingUserConnectionToLobbyEndpoint,
//       open: openReconnectingUserConnectionToLobby,
//     } = await lobbyInMemoryTransport.createConnection({
//       type: ConnectionRole.User,
//       clientCachedGuestReconnectionToken: someUserReconnectionToken,
//     });

//     const typedReconnectingUserConnectionToLobbyEndpoint =
//       reconnectingUserConnectionToLobbyEndpoint.toTyped<ClientIntent, GameStateUpdate>();

//     let reconnectionSessionClaimToken;
//     typedReconnectingUserConnectionToLobbyEndpoint.subscribeAll(
//       (message) => {
//         console.log("message for user reconnecting to lobby:", message);
//         if (message.type === GameStateUpdateType.GameServerConnectionInstructions) {
//           reconnectionSessionClaimToken =
//             message.data.connectionInstructions.encryptedSessionClaimToken;
//         }
//       },
//       async (reason) => {
//         //
//       }
//     );

//     await openReconnectingUserConnectionToLobby();

//     expect(reconnectionSessionClaimToken).toBeDefined();

//     await typedReconnectingUserConnectionToLobbyEndpoint.close();

//     const {
//       serverEndpoint: serverReconnectingUserConnectionToGameServerEndpoint,
//       clientEndpoint: clientReconnectingUserConnectionToGameServerEndpoint,
//       open: openReconnectionToGameServer,
//     } = await gameServerInMemoryTransport.createConnection({
//       type: ConnectionRole.User,
//       encodedGameServerSessionClaimToken: reconnectionSessionClaimToken,
//     });

//     const typedReconnectionToGameServerEndpoint =
//       clientReconnectingUserConnectionToGameServerEndpoint.toTyped<ClientIntent, GameStateUpdate>();

//     typedReconnectionToGameServerEndpoint.subscribeAll(
//       (message) => {
//         console.log("message for user reconnecting to game server:", message);
//       },
//       async (reason) => {
//         //
//       }
//     );

//     await openReconnectionToGameServer();
//   });
// });
