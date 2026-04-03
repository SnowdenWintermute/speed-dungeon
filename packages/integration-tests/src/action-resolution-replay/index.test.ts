import {
  ClientIntentType,
  CombatantClass,
  DungeonRoomType,
  EntityName,
  ERROR_MESSAGES,
  GameMode,
  GameName,
  GameServer,
  IndexedDbAssetStore,
  invariant,
  LobbyServer,
  MonsterGenerator,
  PartyName,
  RandomNumberGenerationPolicyFactory,
  TEST_DUNGEON_SIMPLE,
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

      const rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();
      const monsterGenerator = MonsterGenerator.createFromPolicy(rngPolicy);

      gameServer.dungeonGenerationPolicy.setFloors(TEST_DUNGEON_SIMPLE, monsterGenerator);
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

      const { lobbyClientRef, gameClientRef, gameContext } = clientApplication;

      await clientApplication.topologyManager.enterOnline(
        `http://localhost:${TEST_LOBBY_SERVER_PORT}`
      );
      const lobbyClientHarness = new ClientTestHarness(clientApplication, lobbyClientRef.get());
      await testToCharacterInParty(lobbyClientHarness, clientApplication, CombatantClass.Warrior);
      await lobbyClientHarness.settleIntentResult({
        type: ClientIntentType.ToggleReadyToStartGame,
        data: undefined,
      });

      await clientApplication.sequentialEventProcessor.waitUntilIdle();
      await clientApplication.transitionToGameServer.waitFor();

      const gameClientHarness = new ClientTestHarness(clientApplication, gameClientRef.get());
      expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.Empty);
      await gameClientHarness.settleIntentResult({
        type: ClientIntentType.ToggleReadyToExplore,
        data: undefined,
      });
      expect(gameContext.requireParty().currentRoom.roomType).toBe(DungeonRoomType.MonsterLair);
    });
  }
);

async function testToCharacterInParty(
  lobbyClientHarness: ClientTestHarness,
  clientApplication: ClientApplication,
  combatantClass: CombatantClass
) {
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
    data: { name: "a" as EntityName, combatantClass },
  });
  expect(
    clientApplication.gameContext.requireParty().combatantManager.getAllCombatants().size
  ).toBe(1);
}

async function testCharacterCreationRules(
  lobbyClientHarness: ClientTestHarness,
  clientApplication: ClientApplication
) {
  await testToCharacterInParty(lobbyClientHarness, clientApplication, CombatantClass.Rogue);
  const { gameContext, errorRecordService } = clientApplication;

  await lobbyClientHarness.settleIntentResult({
    type: ClientIntentType.CreateCharacter,
    data: { name: "b" as EntityName, combatantClass: CombatantClass.Rogue },
  });
  await lobbyClientHarness.settleIntentResult({
    type: ClientIntentType.CreateCharacter,
    data: { name: "c" as EntityName, combatantClass: CombatantClass.Rogue },
  });
  expect(gameContext.requireParty().combatantManager.getAllCombatants().size).toBe(3);
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
    data: { name: "d" as EntityName, combatantClass: CombatantClass.Warrior },
  });
}
