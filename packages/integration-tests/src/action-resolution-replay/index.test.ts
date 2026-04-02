// need to be able to:
// - outfit a party of characters with specific
//   - stats
//   - abilities
//   - test equipment with specific
//     - durability state
//     - affixes with set values
// - enter a battle with monsters with specific
//   - stats
// - to this end we can create "test dungeon floors" filled with rooms of test fixture monsters
//
// - configure test game server with a RandomNumberGenerator that gives constant or scripted rolls (0.5, or [0.1, 0.5,...] for example)
// - trigger player client to dispatch actions to a test game server
// - await resolution of client handling of messages from test game server
// - assert game client state

import {
  ClientIntentType,
  CombatantBuilder,
  CombatantClass,
  DungeonRoomType,
  EntityName,
  ERROR_MESSAGES,
  GameMode,
  GameName,
  GameServer,
  IdGenerator,
  IndexedDbAssetStore,
  invariant,
  LobbyServer,
  MonsterType,
  PartyName,
} from "@speed-dungeon/common";
import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "../servers/fixtures/test-connection-endpoint-factories.js";
import { TimeMachine } from "../test-utils/time-machine.js";
import { createTestServers } from "../servers/fixtures/create-test-servers.js";
import { ClientApplication } from "@/client-application";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers.js";
import fakeIndexedDB from "fake-indexeddb";
import { TEST_LOBBY_SERVER_PORT } from "@/servers/fixtures/index.js";
import { ClientTestHarness } from "@/test-utils/client-test-harness.js";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "experiment with new architecture",
  // ({ clientEndpointFactory, authSessionIds }) => {
  ({ clientEndpointFactory }) => {
    let lobbyServer: LobbyServer;
    let gameServer: GameServer;
    const timeMachine = new TimeMachine();

    beforeEach(async () => {
      const { lobbyIncomingConnectionGateway, gameServerIncomingConnectionGateway } =
        clientEndpointFactory.createIncomingConnectionGateways();

      const inMemoryTransportAndServers = await createTestServers(
        lobbyIncomingConnectionGateway,
        gameServerIncomingConnectionGateway
      );

      lobbyServer = inMemoryTransportAndServers.lobbyServer;
      gameServer = inMemoryTransportAndServers.gameServer;

      const idGenerator = new IdGenerator({ saveHistory: false });
      gameServer.dungeonGenerationPolicy.setFloors([
        [
          {
            type: DungeonRoomType.MonsterLair,
            monsters: [CombatantBuilder.monster(MonsterType.Spider).build(idGenerator)],
          },
        ],
      ]);
    });

    afterEach(async () => {
      lobbyServer.closeTransportServer();
      gameServer.closeTransportServer();
      timeMachine.returnToPresent();
    });

    it("instantiates", async () => {
      const assetCache = new IndexedDbAssetStore(fakeIndexedDB);
      const tickScheduler = new ManualTickScheduler();
      const clientApplication = new ClientApplication(
        assetCache,
        `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
        tickScheduler.scheduler
      );

      const { lobbyClientRef, gameContext, errorRecordService } = clientApplication;

      await clientApplication.topologyManager.enterOnline(
        `http://localhost:${TEST_LOBBY_SERVER_PORT}`
      );
      const lobbyClientHarness = new ClientTestHarness(
        clientApplication,
        clientApplication.lobbyClientRef.get()
      );
      await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.CreateGame,
        data: { gameName: "a" as GameName, mode: GameMode.Race },
      });
      expect(clientApplication.gameContext.requireGame().name).toBe("a");
      await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.CreateParty,
        data: { partyName: "a" as PartyName },
      });
      expect(clientApplication.gameContext.requireParty().name).toBe("a");
      await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.CreateCharacter,
        data: { name: "a" as EntityName, combatantClass: CombatantClass.Rogue },
      });
      expect(
        clientApplication.gameContext.requireParty().combatantManager.getAllCombatants().size
      ).toBe(1);
      await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.CreateCharacter,
        data: { name: "b" as EntityName, combatantClass: CombatantClass.Rogue },
      });
      await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.CreateCharacter,
        data: { name: "c" as EntityName, combatantClass: CombatantClass.Rogue },
      });
      expect(
        clientApplication.gameContext.requireParty().combatantManager.getAllCombatants().size
      ).toBe(3);
      const lastIntentId = await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.CreateCharacter,
        data: { name: "d" as EntityName, combatantClass: CombatantClass.Rogue },
      });
      expect(errorRecordService.getLastError()).toEqual({
        message: ERROR_MESSAGES.GAME.MAX_PARTY_SIZE,
        clientIntentSequenceId: lastIntentId,
      });
      const someOwnedCombatantId = gameContext
        .requireParty()
        .combatantManager.getPartyMemberCombatants()[0]
        ?.getEntityId();
      invariant(someOwnedCombatantId !== undefined);
      await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.DeleteCharacter,
        data: { characterId: someOwnedCombatantId },
      });
      await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.CreateCharacter,
        data: { name: "d" as EntityName, combatantClass: CombatantClass.Rogue },
      });
      expect(errorRecordService.count).toBe(1);
    });
  }
);
