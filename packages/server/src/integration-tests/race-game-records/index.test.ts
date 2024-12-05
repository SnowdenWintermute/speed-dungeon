import { jest } from "@jest/globals";
import { Application } from "express";
import request, { Agent } from "supertest";
import { createServer } from "http";
import { Socket as ClientSocket } from "socket.io-client";
// this syntax is for mocking ESM files in jest
jest.unstable_mockModule("../../game-server/get-logged-in-user-or-create-guest.js", () => ({
  getLoggedInUserOrCreateGuest: jest.fn(),
}));
jest.unstable_mockModule("../../database/get-user-ids-by-username.js", () => ({
  getUserIdsByUsername: jest.fn(),
}));
jest.unstable_mockModule(
  "../../game-server/game-event-handlers/toggle-ready-to-descend-handler/check-if-allowed-to-descend.js",
  () => ({
    checkIfAllowedToDescend: jest.fn(),
  })
);
jest.unstable_mockModule(
  "../../game-server/game-event-handlers/character-uses-selected-combat-action-handler/compose-action-command-payloads-from-action-results.js",
  () => ({
    composeActionCommandPayloadsFromActionResults: jest.fn(),
  })
);

let { getLoggedInUserOrCreateGuest } = await import(
  "../../game-server/get-logged-in-user-or-create-guest.js"
);
let { getUserIdsByUsername } = await import("../../database/get-user-ids-by-username.js");
let { checkIfAllowedToDescend } = await import(
  "../../game-server/game-event-handlers/toggle-ready-to-descend-handler/check-if-allowed-to-descend.js"
);
let { composeActionCommandPayloadsFromActionResults } = await import(
  "../../game-server/game-event-handlers/character-uses-selected-combat-action-handler/compose-action-command-payloads-from-action-results.js"
);
let mockedGetLoggedInUserOrCreateGuest = getLoggedInUserOrCreateGuest as jest.MockedFunction<
  typeof getLoggedInUserOrCreateGuest
>;
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

let { raceGameRecordsRepo } = await import("../../database/repos/race-game-records.js");
let { GameServer } = await import("../../game-server/index.js");
let { gameServer } = await import("../../singletons.js");
let { getRaceGameRecordWithTwoPartyRecords } = await import(
  "../get-race-record-with-two-parties.js"
);

import PGTestingContext from "../../utils/pg-testing-context.js";
const { createExpressApp } = await import("../../create-express-app.js");
import { valkeyManager } from "../../kv-store/index.js";
import setUpTestDatabaseContexts from "../../utils/set-up-test-database-contexts.js";
import { Server } from "socket.io";
import {
  ActionCommandType,
  BattleConclusion,
  ClientToServerEvent,
  ClientToServerEventTypes,
  CombatActionType,
  CombatAttribute,
  Combatant,
  AbilityName,
  CombatantClass,
  DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE,
  GAME_CONFIG,
  GameMessageType,
  GameMode,
  HpChangeSource,
  HpChangeSourceCategoryType,
  MeleeOrRanged,
  PartyFate,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { env } from "../../validate-env.js";
import {
  emitGameSetupForTwoUsers,
  registerSocket,
  waitForCondition,
  waitForUsersLeavingServer,
} from "../utils.js";
import { HpChange } from "@speed-dungeon/common/src/combat/action-results/hp-change-result-calculation/index.js";

export let pgContext: PGTestingContext;
export let expressApp: Application;
export let agent: Agent;
export let io: Server;
export let httpServer: ReturnType<typeof createServer>;
export let serverAddress: string;
export const clientSockets: {
  [name: string]: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>;
} = {};

describe("race game records", () => {
  const testId = Date.now().toString();
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
    GAME_CONFIG.MONSTER_LAIRS_PER_FLOOR = 1;
  });

  beforeEach(async () => {
    global.Date.now = realDateNow;

    io.sockets.sockets.forEach((socket) => {
      socket.disconnect(true);
    });
    await valkeyManager.context.removeAllKeys();
    await raceGameRecordsRepo.dropAll();
    agent = request.agent(expressApp);
    GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE = DEFAULT_LEVEL_TO_REACH_FOR_ESCAPE;
    jest.clearAllMocks();
    ({ getLoggedInUserOrCreateGuest } = await import(
      "../../game-server/get-logged-in-user-or-create-guest.js"
    ));
    mockedGetLoggedInUserOrCreateGuest
      .mockResolvedValueOnce({ username: "user1", userId: 1 })
      .mockResolvedValueOnce({ username: "user2", userId: 2 });
    ({ getUserIdsByUsername } = await import("../../database/get-user-ids-by-username.js"));
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

      const records = await getRaceGameRecordWithTwoPartyRecords(1, party1Name, party2Name);
      if (!records) return expect(records).toBeTruthy();
      expect(records.record.time_of_completion).toBe(null);
      expect(records.party1Record.party_fate).toBe(PartyFate.Wipe);
      user2.disconnect();

      await waitForCondition(async () => {
        const records = await getRaceGameRecordWithTwoPartyRecords(1, party1Name, party2Name);
        if (!records) return false;
        const { record, party2Record } = records;

        const party2Wiped = party2Record.party_fate === PartyFate.Wipe;
        const gameMarkedComplete = record.time_of_completion !== null;
        return party2Wiped && gameMarkedComplete;
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
        "test game",
        user1,
        user2
      ));

      user2.emit(ClientToServerEvent.ToggleReadyToStartGame);
      user1.emit(ClientToServerEvent.ToggleReadyToStartGame);
    });

    user1.on(ServerToClientEvent.GameStarted, () => {
      user1.off(ServerToClientEvent.GameStarted);
      user1.emit(ClientToServerEvent.ToggleReadyToExplore);
      useAttackAction(user1, character1);
    });

    user2.on(ServerToClientEvent.GameMessage, async (data) => {
      if (data.type === GameMessageType.PartyWipe) {
        await waitForCondition(async () => {
          const records = await getRaceGameRecordWithTwoPartyRecords(1, party1Name, party2Name);
          if (!records) return false;
          const { record, party1Record } = records;

          const party1Wiped = party1Record.party_fate === PartyFate.Wipe;
          const gameNotYetMarkedComplete = record.time_of_completion === null;
          return party1Wiped && gameNotYetMarkedComplete;
        });

        user2.emit(ClientToServerEvent.ToggleReadyToDescend);
      } else if (data.type === GameMessageType.PartyEscape) {
        user2.off(ServerToClientEvent.GameMessage);

        await waitForCondition(async () => {
          const records = await getRaceGameRecordWithTwoPartyRecords(1, party1Name, party2Name);
          if (!records) return false;
          const { record, party1Record, party2Record } = records;

          const party2MarkedWinner = party2Record.is_winner && !party1Record.is_winner;
          return (
            party1Record.party_fate === PartyFate.Wipe &&
            party2Record.party_fate === PartyFate.Escape &&
            record.time_of_completion !== null &&
            party2MarkedWinner
          );
        });
        done();
      }
    });
  });

  it("correctly records a ranked race game in which one party escapes and another party stays and later escapes", (done) => {
    GAME_CONFIG.LEVEL_TO_REACH_FOR_ESCAPE = 2;
    // just let the winning party descend so they can escape
    mockedCheckIfAllowedToDescend.mockReturnValue(undefined);
    let party1Name: string, party2Name: string;
    const user1 = registerSocket("user1", serverAddress, clientSockets);
    const user2 = registerSocket("user2", serverAddress, clientSockets);

    user1.on("connect", async () => {
      ({ party1Name, party2Name } = await emitGameSetupForTwoUsers("test game", user1, user2));
      user2.emit(ClientToServerEvent.ToggleReadyToStartGame);
      user1.emit(ClientToServerEvent.ToggleReadyToStartGame);
    });

    user1.on(ServerToClientEvent.GameStarted, async () => {
      user1.off(ServerToClientEvent.GameStarted);
      user1.emit(ClientToServerEvent.ToggleReadyToDescend);
      await waitForCondition(async () => {
        const records = await getRaceGameRecordWithTwoPartyRecords(1, party1Name, party2Name);
        if (!records) return false;
        const { record, party1Record } = records;

        const gameMarkedComplete = record.time_of_completion !== null;
        const party1MarkedWinner = party1Record.is_winner;
        const party1Escaped = party1Record.party_fate === PartyFate.Escape;
        return gameMarkedComplete && party1MarkedWinner && party1Escaped;
      });
      user1.disconnect();
      user2.emit(ClientToServerEvent.ToggleReadyToDescend);
    });

    user2.on(ServerToClientEvent.DungeonFloorNumber, async (data) => {
      if (data !== 2) return;

      await waitForCondition(async () => {
        const records = await getRaceGameRecordWithTwoPartyRecords(1, party1Name, party2Name);
        if (!records) return false;
        const { party2Record, party1Record } = records;

        const party1WipeMarked = party1Record.party_fate === PartyFate.Wipe;
        const party2MarkedWinner = party2Record.is_winner;
        const party2EscapeMarked = party2Record.party_fate === PartyFate.Escape;
        return !party1WipeMarked && !party2MarkedWinner && party2EscapeMarked;
      });
      await waitForUsersLeavingServer(gameServer, [user1, user2]);
      done();
    });
  });

  it("correctly records a ranked race game in which both parties suffer natural wipes", (done) => {
    // taking any combat action should now wipe a party
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
    let party1Name: string, party2Name: string, character1: Combatant, character2: Combatant;
    const user1 = registerSocket("user1", serverAddress, clientSockets);
    const user2 = registerSocket("user2", serverAddress, clientSockets);
    user1.on("connect", async () => {
      ({ party1Name, party2Name, character1, character2 } = await emitGameSetupForTwoUsers(
        "test game",
        user1,
        user2
      ));
      user2.emit(ClientToServerEvent.ToggleReadyToStartGame);
      user1.emit(ClientToServerEvent.ToggleReadyToStartGame);
    });

    user1.on(ServerToClientEvent.GameStarted, async () => {
      user1.emit(ClientToServerEvent.ToggleReadyToExplore);
      useAttackAction(user1, character1);
      user2.emit(ClientToServerEvent.ToggleReadyToExplore);
      useAttackAction(user2, character2);

      await waitForCondition(async () => {
        const records = await getRaceGameRecordWithTwoPartyRecords(1, party1Name, party2Name);
        if (!records) return false;
        const { record, party2Record, party1Record } = records;

        return (
          party1Record.party_fate === PartyFate.Wipe &&
          !party1Record.is_winner &&
          party2Record.party_fate === PartyFate.Wipe &&
          !party2Record.is_winner &&
          record.time_of_completion !== null
        );
      });
      await waitForUsersLeavingServer(gameServer, [user1, user2]);
      done();
    });
  });

  it("correctly records a ranked race game in which a player abandons their dead allies", (done) => {
    GAME_CONFIG.MIN_RACE_GAME_PARTIES = 1;
    const gameName = "test game";
    const user1 = registerSocket("user1", serverAddress, clientSockets);
    const user2 = registerSocket("user2", serverAddress, clientSockets);
    const party1Name = "party 1";
    const character1Name = "character 1";
    const character2Name = "character 2";
    let character1: Combatant;
    let character2: Combatant;
    user1.on("connect", async () => {
      user1.emit(ClientToServerEvent.CreateGame, { gameName, mode: GameMode.Race, isRanked: true });
      user1.emit(ClientToServerEvent.CreateParty, party1Name);
      user1.emit(ClientToServerEvent.CreateCharacter, {
        name: character1Name,
        combatantClass: CombatantClass.Mage,
      });

      user1.on(ServerToClientEvent.CharacterAddedToParty, (_partyName, _username, character) => {
        character1 = character;
        // make them go first
        gameServer.current!.games.get(gameName)!.adventuringParties[party1Name]!.characters[
          character1.entityProperties.id
        ]!.combatantProperties.inherentAttributes[CombatAttribute.Speed] = 999;

        user1.off(ServerToClientEvent.CharacterAddedToParty);

        user2.emit(ClientToServerEvent.JoinGame, gameName);
        user2.emit(ClientToServerEvent.JoinParty, party1Name);
        user2.emit(ClientToServerEvent.CreateCharacter, {
          name: character2Name,
          combatantClass: CombatantClass.Mage,
        });
      });

      user2.on(ServerToClientEvent.CharacterAddedToParty, (_partyName, _username, character) => {
        character2 = character;
        user2.off(ServerToClientEvent.CharacterAddedToParty);
      });

      await waitForCondition(async () => {
        return character1 !== undefined && character2 !== undefined;
      });

      user2.emit(ClientToServerEvent.ToggleReadyToStartGame);
      user1.emit(ClientToServerEvent.ToggleReadyToStartGame);
    });

    mockedComposeActionCommandPayloadsFromActionResults.mockImplementation(() => {
      return [
        {
          type: ActionCommandType.PerformCombatAction,
          combatAction: {
            type: CombatActionType.AbilityUsed,
            abilityName: AbilityName.Attack,
          },
          hpChangesByEntityId: {
            [character1.entityProperties.id]: new HpChange(
              -9999,
              new HpChangeSource({
                type: HpChangeSourceCategoryType.PhysicalDamage,
                meleeOrRanged: MeleeOrRanged.Melee,
              })
            ),
          },
          mpChangesByEntityId: null,
          missesByEntityId: [],
        },
      ];
    });

    user1.on(ServerToClientEvent.GameStarted, () => {
      user1.off(ServerToClientEvent.GameStarted);
      user1.emit(ClientToServerEvent.ToggleReadyToExplore);
      user2.emit(ClientToServerEvent.ToggleReadyToExplore);
    });
    user1.on(ServerToClientEvent.BattleFullUpdate, () => {
      useAttackAction(user1, character1);
    });

    user1.on(ServerToClientEvent.ActionCommandPayloads, async () => {
      expect(
        gameServer.current!.games.get(gameName)!.adventuringParties[party1Name]!.characters[
          character1.entityProperties.id
        ]!.combatantProperties.hitPoints
      ).toBe(0);

      user2.disconnect();
      await waitForCondition(async () => {
        const records = await raceGameRecordsRepo.findAllGamesByUserId(1);
        const gameRecord = records[0];
        if (!gameRecord) return false;
        const party1Record = gameRecord.parties[party1Name];
        if (!records) return false;

        return (
          party1Record?.party_fate === PartyFate.Wipe && gameRecord.time_of_completion !== null
        );
      });

      await waitForUsersLeavingServer(gameServer, [user1]);
      done();
    });
  });

  // OTHER TESTS TO DO
  // server crashes mid game
});

function useAttackAction(
  socket: ClientSocket<ServerToClientEventTypes, ClientToServerEventTypes>,
  character: Combatant
) {
  socket.emit(ClientToServerEvent.SelectCombatAction, {
    characterId: character.entityProperties.id,
    combatActionOption: {
      type: CombatActionType.AbilityUsed,
      abilityName: AbilityName.Attack,
    },
  });
  socket.emit(ClientToServerEvent.UseSelectedCombatAction, {
    characterId: character.entityProperties.id,
  });
}
