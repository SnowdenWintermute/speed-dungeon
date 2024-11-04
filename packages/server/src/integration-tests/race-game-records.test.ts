import { jest } from "@jest/globals";
import { Application } from "express";
import request, { Agent } from "supertest";
import { createServer } from "http";
import { Socket as ClientSocket } from "socket.io-client";
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
jest.unstable_mockModule(
  "../game-server/game-event-handlers/character-uses-selected-combat-action-handler/compose-action-command-payloads-from-action-results.js",
  () => ({
    composeActionCommandPayloadsFromActionResults: jest.fn(),
  })
);

let { authenticateUser } = await import("../game-server/authenticate-user.js");
let { getUserIdsByUsername } = await import("../database/get-user-ids-by-username.js");
let { raceGameRecordsRepo } = await import("../database/repos/race-game-records.js");
let { checkIfAllowedToDescend } = await import(
  "../game-server/game-event-handlers/toggle-ready-to-descend-handler/check-if-allowed-to-descend.js"
);
let { composeActionCommandPayloadsFromActionResults } = await import(
  "../game-server/game-event-handlers/character-uses-selected-combat-action-handler/compose-action-command-payloads-from-action-results.js"
);
let mockedAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;
let mockedGetUserIdsByUsername = getUserIdsByUsername as jest.MockedFunction<
  typeof getUserIdsByUsername
>;
let mockedCheckIfAllowedToDescend = checkIfAllowedToDescend as jest.MockedFunction<
  typeof checkIfAllowedToDescend
>;
let mockedComposeActionCommandPayloadsFromActionResults =
  composeActionCommandPayloadsFromActionResults as jest.MockedFunction<
    typeof composeActionCommandPayloadsFromActionResults
  >;
let { gameServer } = await import("../singletons.js");
let { GameServer } = await import("../game-server/index.js");

import PGTestingContext from "../utils/pg-testing-context.js";
import { createExpressApp } from "../create-express-app.js";
import { valkeyManager } from "../kv-store/index.js";
import setUpTestDatabaseContexts from "../utils/set-up-test-database-contexts.js";
import { Server } from "socket.io";
import {
  ActionCommandType,
  BattleConclusion,
  ClientToServerEvent,
  ClientToServerEventTypes,
  CombatActionType,
  Combatant,
  CombatantAbilityName,
  DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE,
  GAME_CONFIG,
  GameMessageType,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { env } from "../validate-env.js";
import { emitGameSetupForTwoUsers, registerSocket, waitForCondition } from "./utils.js";

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
    await raceGameRecordsRepo.dropAll();
    agent = request.agent(expressApp);
    GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE = DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE;
    jest.clearAllMocks();
    ({ authenticateUser } = await import("../game-server/authenticate-user.js"));
    mockedAuthenticateUser.mockResolvedValueOnce(["user1", 1]).mockResolvedValueOnce(["user2", 2]);
    ({ getUserIdsByUsername } = await import("../database/get-user-ids-by-username.js"));
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

  it("correctly records a game record when both players disconnect at the start of a game", (done) => {
    let party1Name: string, party2Name: string;
    const user1 = registerSocket("user1", serverAddress, clientSockets);
    const user2 = registerSocket("user2", serverAddress, clientSockets);

    user1.on("connect", async () => {
      ({ party1Name, party2Name } = await emitGameSetupForTwoUsers("test game", user1, user2));

      user2.emit(ClientToServerEvent.ToggleReadyToStartGame);
      user1.emit(ClientToServerEvent.ToggleReadyToStartGame);
    });

    user2.on(ServerToClientEvent.GameMessage, async (data) => {
      expect(data.message).toContain(`Party "${party1Name}" was defeated`);

      const rows = await raceGameRecordsRepo.findAllGamesByUserId(1);
      const gameRecord = rows[0];
      if (!gameRecord) return expect(gameRecord).toBeTruthy();
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

  it("handles the record updates for when one party wipes and another escapes later", (done) => {
    GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE = 2;
    // just let the winning party descend so they can escape
    mockedCheckIfAllowedToDescend.mockReturnValue(undefined);
    // this should simulate a wipe whenever a player takes any combat action
    mockedComposeActionCommandPayloadsFromActionResults.mockImplementation(() => {
      return [
        {
          type: ActionCommandType.BattleResult,
          conclusion: BattleConclusion.Defeat,
          loot: [],
          experiencePointChanges: {},
          timestamp: Date.now(),
        },
      ];
    });

    let party1Name: string, party2Name: string, character1: Combatant;
    const user1 = registerSocket("user1", serverAddress, clientSockets);
    const user2 = registerSocket("user2", serverAddress, clientSockets);

    user1.on("connect", async () => {
      ({ party1Name, party2Name, character1 } = await emitGameSetupForTwoUsers(
        "test game 2",
        user1,
        user2
      ));

      user2.emit(ClientToServerEvent.ToggleReadyToStartGame);
      user1.emit(ClientToServerEvent.ToggleReadyToStartGame);
    });

    user1.on(ServerToClientEvent.GameStarted, () => {
      user1.off(ServerToClientEvent.GameStarted);
      user1.emit(ClientToServerEvent.ToggleReadyToExplore);
      user1.emit(ClientToServerEvent.SelectCombatAction, {
        characterId: character1.entityProperties.id,
        combatActionOption: {
          type: CombatActionType.AbilityUsed,
          abilityName: CombatantAbilityName.Attack,
        },
      });

      // we mocked the handling of this event to create
      // a battle result action command with defeat (so we wipe them)
      user1.emit(ClientToServerEvent.UseSelectedCombatAction, {
        characterId: character1.entityProperties.id,
      });
    });

    user2.on(ServerToClientEvent.GameMessage, async (data) => {
      if (data.type === GameMessageType.PartyWipe) {
        await waitForCondition(async () => {
          const recordShouldContainWipe = await raceGameRecordsRepo.findAllGamesByUserId(1);
          const record = recordShouldContainWipe[0];
          if (!record) return false;
          const party1Record = record.parties[party1Name];
          if (!party1Record) return false;

          const partyWipeTimeUpdated = party1Record.duration_to_wipe !== null;
          const gameNotYetMarkedComplete = record.time_of_completion === null;
          return partyWipeTimeUpdated && gameNotYetMarkedComplete;
        });

        user2.emit(ClientToServerEvent.ToggleReadyToDescend);
      } else if (data.type === GameMessageType.PartyEscape) {
        user2.off(ServerToClientEvent.GameMessage);

        await waitForCondition(async () => {
          const recordShouldContainWipeAndVictory =
            await raceGameRecordsRepo.findAllGamesByUserId(1);
          const record = recordShouldContainWipeAndVictory[0];
          if (!record) return false;
          const party1Record = record.parties[party1Name];
          const party2Record = record.parties[party2Name];
          if (!party1Record || !party2Record) return false;

          const partyWipeTimeUpdated = party1Record.duration_to_wipe !== null;
          const partyEscapeTimeUpdated = party2Record.duration_to_escape !== null;
          const gameMarkedComplete = record.time_of_completion !== null;
          const party2MarkedWinner = party2Record.is_winner && !party1Record.is_winner;
          return (
            partyWipeTimeUpdated &&
            partyEscapeTimeUpdated &&
            gameMarkedComplete &&
            party2MarkedWinner
          );
        });
        done();
      }
    });
  });

  // OTHER TESTS TO DO
  // one party escapes, other stays in game
  // server crashes mid game
});
