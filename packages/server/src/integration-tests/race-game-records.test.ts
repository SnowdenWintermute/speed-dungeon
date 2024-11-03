import { jest } from "@jest/globals";
// this syntax is for mocking ESM files in jest
jest.unstable_mockModule("../game-server/authenticate-user.js", () => ({
  authenticateUser: jest.fn(),
}));
jest.unstable_mockModule("../database/get-user-ids-by-username.js", () => ({
  getUserIdsByUsername: jest.fn(),
}));

let { authenticateUser } = await import("../game-server/authenticate-user.js");
let { getUserIdsByUsername } = await import("../database/get-user-ids-by-username.js");
let mockedAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;
let mockedGetUserIdsByUsername = getUserIdsByUsername as jest.MockedFunction<
  typeof getUserIdsByUsername
>;
let { gameServer } = await import("../singletons.js");
let { GameServer } = await import("../game-server/index.js");

import { Application } from "express";
import request, { Agent } from "supertest";
import PGTestingContext from "../utils/pg-testing-context.js";
import { createExpressApp } from "../create-express-app.js";
import { valkeyManager } from "../kv-store/index.js";
import setUpTestDatabaseContexts from "../utils/set-up-test-database-contexts.js";
import { Server } from "socket.io";
import {
  ClientToServerEvent,
  ClientToServerEventTypes,
  CombatantClass,
  GameMode,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { env } from "../validate-env.js";
import { createServer } from "http";
import { Socket as ClientSocket, io as clientSocket } from "socket.io-client";

describe("race game records", () => {
  const testId = Date.now().toString();
  let pgContext: PGTestingContext;
  let expressApp: Application;
  let agent: Agent;
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let serverAddress: string;
  const clientSockets: {
    [name: string]: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>;
  } = {};

  beforeAll(async () => {
    pgContext = await setUpTestDatabaseContexts(testId);
    expressApp = createExpressApp();
    httpServer = createServer(expressApp);
    io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(httpServer, {
      cors: { origin: env.FRONT_END_URL, credentials: true },
    });

    gameServer.current = new GameServer(io);
    httpServer.listen();
    serverAddress = `http://localhost:${(httpServer.address() as any).port}`;
  });

  beforeEach(async () => {
    io.sockets.sockets.forEach((socket) => {
      socket.disconnect();
    });
    await valkeyManager.context.removeAllKeys();
    agent = request.agent(expressApp);
    jest.clearAllMocks();
    ({ authenticateUser } = await import("../game-server/authenticate-user.js"));
    mockedAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;
    mockedAuthenticateUser.mockResolvedValueOnce(["user1", 1]).mockResolvedValueOnce(["user2", 2]);
    ({ getUserIdsByUsername } = await import("../database/get-user-ids-by-username.js"));
    mockedGetUserIdsByUsername = getUserIdsByUsername as jest.MockedFunction<
      typeof getUserIdsByUsername
    >;
    mockedGetUserIdsByUsername.mockResolvedValue({ ["user1"]: 1, ["user2"]: 2 });
  });

  afterAll(async () => {
    await pgContext.cleanup();
    await valkeyManager.context.cleanup();
    io.close();
    httpServer.close();
    for (const socket of Object.values(clientSockets)) {
      socket.disconnect();
    }
  });

  it("does something", (done) => {
    // client 1 hosts game
    // client 1 creates party
    // client 1 creates character
    // client 2 joins game
    // client 2 creates party
    // client 2 creates character
    // client 1 clicks ready
    // client 2 clicks ready
    // client 1 disconnects
    // client 2 disconnects
    // there should be a race game record with
    // - both parties
    // - parties should contain repsective characters
    // - both should have a duration to wipe
    // - game record should be marked as completed
    // - neither party should be the winner
    console.log("TEST 1");
    const gameName = "test game";
    const party1Name = "party 1";
    const party2Name = "party 2";
    const character1Name = "character 1";
    const character2Name = "character 2";
    const user1 = registerSocket("user1", serverAddress, clientSockets);
    const user2 = registerSocket("user2", serverAddress, clientSockets);
    Object.values(clientSockets).forEach((socket) => {
      socket.on(ServerToClientEvent.ErrorMessage, (data) => {
        console.log("ERROR: ", data);
      });
    });

    user2.on(ServerToClientEvent.GameMessage, (data) => {
      console.log("got game message data: ", data);
      done();
    });

    user1.on("connect", () => {
      user1.emit(ClientToServerEvent.CreateGame, { gameName, mode: GameMode.Race, isRanked: true });
      user1.emit(ClientToServerEvent.CreateParty, party1Name);
      user1.emit(ClientToServerEvent.CreateCharacter, {
        name: character1Name,
        combatantClass: CombatantClass.Mage,
      });

      user2.emit(ClientToServerEvent.JoinGame, gameName);
      user2.emit(ClientToServerEvent.CreateParty, party2Name);
      user2.emit(ClientToServerEvent.CreateCharacter, {
        name: character2Name,
        combatantClass: CombatantClass.Mage,
      });

      user1.emit(ClientToServerEvent.ToggleReadyToStartGame);
      user2.emit(ClientToServerEvent.ToggleReadyToStartGame);

      user1.disconnect();
    });
  });
});

function registerSocket(
  name: string,
  serverAddress: string,
  clientSockets: {
    [name: string]: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>;
  }
): ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes> {
  const socket = clientSocket(serverAddress);
  clientSockets[name] = socket;
  return socket;
}
