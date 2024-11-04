import { jest } from "@jest/globals";
import { Application } from "express";
import request, { Agent } from "supertest";
import { createServer } from "http";
import { Socket as ClientSocket, io as clientSocket } from "socket.io-client";
// this syntax is for mocking ESM files in jest
jest.unstable_mockModule("../game-server/authenticate-user.js", () => ({
  authenticateUser: jest.fn(),
}));
jest.unstable_mockModule("../database/get-user-ids-by-username.js", () => ({
  getUserIdsByUsername: jest.fn(),
}));
jest.unstable_mockModule(
  "../game-server/game-event-handlers/toggle-ready-to-descend-handler/check-if-allowed-to-descend.js",
  () => ({
    checkIfAllowedToDescend: jest.fn(),
  })
);

let { authenticateUser } = await import("../game-server/authenticate-user.js");
let { getUserIdsByUsername } = await import("../database/get-user-ids-by-username.js");
let { raceGameRecordsRepo } = await import("../database/repos/race-game-records.js");
let { checkIfAllowedToDescend } = await import(
  "../game-server/game-event-handlers/toggle-ready-to-descend-handler/check-if-allowed-to-descend.js"
);
let mockedAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;
let mockedGetUserIdsByUsername = getUserIdsByUsername as jest.MockedFunction<
  typeof getUserIdsByUsername
>;
let mockedCheckIfAllowedToDescend = checkIfAllowedToDescend as jest.MockedFunction<
  typeof checkIfAllowedToDescend
>;
let { gameServer } = await import("../singletons.js");
let { GameServer } = await import("../game-server/index.js");

import PGTestingContext from "../utils/pg-testing-context.js";
import { createExpressApp } from "../create-express-app.js";
import { valkeyManager } from "../kv-store/index.js";
import setUpTestDatabaseContexts from "../utils/set-up-test-database-contexts.js";
import { Server } from "socket.io";
import {
  ClientToServerEvent,
  ClientToServerEventTypes,
  CombatantClass,
  GAME_CONFIG,
  GameMode,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { env } from "../validate-env.js";

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
  const realDateNow = Date.now.bind(global.Date);

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
    global.Date.now = realDateNow;

    io.sockets.sockets.forEach((socket) => {
      socket.disconnect();
    });
    await valkeyManager.context.removeAllKeys();
    agent = request.agent(expressApp);
    jest.clearAllMocks();
    ({ authenticateUser } = await import("../game-server/authenticate-user.js"));
    // mockedAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;
    mockedAuthenticateUser.mockResolvedValueOnce(["user1", 1]).mockResolvedValueOnce(["user2", 2]);
    ({ getUserIdsByUsername } = await import("../database/get-user-ids-by-username.js"));
    // mockedGetUserIdsByUsername = getUserIdsByUsername as jest.MockedFunction<
    //   typeof getUserIdsByUsername
    // >;
    mockedGetUserIdsByUsername.mockResolvedValue({ ["user1"]: 1, ["user2"]: 2 });

    mockedCheckIfAllowedToDescend.mockReturnValue(undefined); // just let them descend so we can do the test
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

  it("correctly records a game record when both players disconnect at the start of a game", (done) => {
    let party1Name: string, party2Name: string, character2Name: string;
    const user1 = registerSocket("user1", serverAddress, clientSockets);
    const user2 = registerSocket("user2", serverAddress, clientSockets);

    user1.on("connect", () => {
      ({ party1Name, party2Name, character2Name } = emitGameSetupForTwoUsers(user1, user2));
    });
    // best to wait for this event to make sure user1 doesn't ready up before user 2 has
    // created their character
    user2.on(ServerToClientEvent.CharacterAddedToParty, (_partyName, _username, character) => {
      if (character.entityProperties.name !== character2Name) return;
      user2.emit(ClientToServerEvent.ToggleReadyToStartGame);
      user1.emit(ClientToServerEvent.ToggleReadyToStartGame);
    });

    user2.on(ServerToClientEvent.GameMessage, async (data) => {
      console.log("GOT GAME MESSAGE: ", data);
      expect(data.message).toContain(`Party "${party1Name}" was defeated`);

      const rows = await raceGameRecordsRepo.findAllGamesByUserId(1);
      const gameRecord = rows[0];
      if (!gameRecord) return expect(gameRecord).toBeTruthy();
      console.log("game record: ", JSON.stringify(gameRecord, null, 2));
      expect(gameRecord.time_of_completion).toBe(null);
      const party1Record = gameRecord.parties[party1Name];
      if (!party1Record) return expect(party1Record).toBeTruthy();
      expect(party1Record.duration_to_wipe).not.toBe(null);
      user2.disconnect();

      await waitForCondition(async () => {
        const rowsAfterLastPlayerLeft = await raceGameRecordsRepo.findAllGamesByUserId(1);
        const record = rowsAfterLastPlayerLeft[0];
        if (!record) return false;
        const party2Record = record.parties[party2Name];
        if (!party2Record) return false;

        console.log(
          "rowsAfterLastPlayerLeft record: ",
          JSON.stringify(rowsAfterLastPlayerLeft, null, 2)
        );
        const partyWipeTimeUpdated = party2Record.duration_to_wipe !== null;
        const gameMarkedComplete = record.time_of_completion !== null;
        return partyWipeTimeUpdated && gameMarkedComplete;
      });

      done();
    });

    user1.on(ServerToClientEvent.DungeonRoomUpdate, (_data) => {
      user1.disconnect();
    });
  });

  it("handles the record updates for when one party wipes and another escapes later", async () => {
    GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE = 2;

    let party1Name: string, party2Name: string, character2Name: string;
    const user1 = registerSocket("user1", serverAddress, clientSockets);
    const user2 = registerSocket("user2", serverAddress, clientSockets);

    user1.on("connect", () => {
      ({ party1Name, party2Name, character2Name } = emitGameSetupForTwoUsers(user1, user2));
    });
  });

  // OTHER TESTS TO DO
  // one party escapes, other stays in game
  // server crashes mid game
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

async function waitForCondition(
  conditionFn: () => Promise<boolean>,
  timeout = 5000,
  interval = 100
) {
  const startTime = Date.now();

  console.log("startTime", startTime);

  while (true) {
    if (await conditionFn()) return;

    if (Date.now() - startTime >= timeout) {
      throw new Error("Condition not met within timeout");
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

function emitGameSetupForTwoUsers(
  user1: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>,
  user2: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const gameName = "test game";
  const party1Name = "party 1";
  const party2Name = "party 2";
  const character1Name = "character 1";
  const character2Name = "character 2";
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
  return { gameName, party1Name, party2Name, character1Name, character2Name };
}
