import { Application } from "express";
import request, { Agent } from "supertest";
import PGTestingContext from "../utils/pg-testing-context.js";
import { createExpressApp } from "../create-express-app.js";
import { valkeyManager } from "../kv-store/index.js";
import setUpTestDatabaseContexts from "../utils/set-up-test-database-contexts.js";
import { gameServer } from "../singletons.js";
import { GameServer } from "../game-server/index.js";
import { Server } from "socket.io";
import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";
import { env } from "../validate-env.js";
import { createServer } from "http";
import Client from "socket.io-client";

describe("race game records", () => {
  const testId = Date.now().toString();
  console.log("TESTID: ", testId);
  let pgContext: PGTestingContext;
  let expressApp: Application;
  let agent: Agent;
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let clientSocket: ReturnType<typeof Client>;

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
    await valkeyManager.context.removeAllKeys();
    agent = request.agent(expressApp);
  });

  afterAll(async () => {
    await pgContext.cleanup();
    await valkeyManager.context.cleanup();
    io.close();
    httpServer.close();
    clientSocket.close();
  });

  it("does something", (done) => {
    expect(true).toBeTruthy();
    clientSocket = Client(`http://localhost:${(httpServer.address() as any).port}`);
    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });
});
