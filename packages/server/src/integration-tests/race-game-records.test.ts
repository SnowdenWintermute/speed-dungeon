import { jest } from "@jest/globals";
// this syntax is for mocking ESM files in jest
jest.unstable_mockModule("../game-server/authenticate-user.js", () => ({
  authenticateUser: jest.fn(),
}));

let { authenticateUser } = await import("../game-server/authenticate-user.js");
let mockedAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;
let { gameServer } = await import("../singletons.js");
let { GameServer } = await import("../game-server/index.js");

import { Application } from "express";
import request, { Agent } from "supertest";
import PGTestingContext from "../utils/pg-testing-context.js";
import { createExpressApp } from "../create-express-app.js";
import { valkeyManager } from "../kv-store/index.js";
import setUpTestDatabaseContexts from "../utils/set-up-test-database-contexts.js";
import { Server } from "socket.io";
import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { env } from "../validate-env.js";
import { createServer } from "http";
import Client from "socket.io-client";

describe("race game records", () => {
  const testId = Date.now().toString();
  let pgContext: PGTestingContext;
  let expressApp: Application;
  let agent: Agent;
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let clientSocket: ReturnType<typeof Client>;
  let otherClientSocket: ReturnType<typeof Client>;
  let lastUserId = 0;

  beforeAll(async () => {
    pgContext = await setUpTestDatabaseContexts(testId);
    expressApp = createExpressApp();
    httpServer = createServer(expressApp);
    io = new Server<ClientToServerEventTypes, ServerToClientEventTypes>(httpServer, {
      cors: { origin: env.FRONT_END_URL, credentials: true },
    });

    gameServer.current = new GameServer(io);
    httpServer.listen();
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

    // ({ gameServer } = await import("../singletons.js"));
    // ({ GameServer } = await import("../game-server/index.js"));
  });

  afterAll(async () => {
    await pgContext.cleanup();
    await valkeyManager.context.cleanup();
    io.close();
    httpServer.close();
    clientSocket.close();
  });

  it("does something", (done) => {
    console.log("TEST 1");
    clientSocket = Client(`http://localhost:${(httpServer.address() as any).port}`, {
      autoConnect: false,
    });

    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
    });

    clientSocket.connect();

    otherClientSocket = Client(`http://localhost:${(httpServer.address() as any).port}`, {
      autoConnect: false,
    });

    otherClientSocket.on("connect", () => {
      expect(otherClientSocket.connected).toBe(true);
    });
    otherClientSocket.connect();
  });

  it("does something else", (done) => {
    console.log("TEST 2");
    clientSocket = Client(`http://localhost:${(httpServer.address() as any).port}`, {
      autoConnect: false,
    });

    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
    });

    clientSocket.connect();

    otherClientSocket = Client(`http://localhost:${(httpServer.address() as any).port}`, {
      autoConnect: false,
    });

    otherClientSocket.on("connect", () => {
      expect(otherClientSocket.connected).toBe(true);
    });
    otherClientSocket.connect();
  });
});
