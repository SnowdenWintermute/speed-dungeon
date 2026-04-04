import { ClientApplication } from "@/client-application";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { TEST_LOBBY_SERVER_PORT } from "@/servers/fixtures";
import { createTestServers } from "@/servers/fixtures/create-test-servers";
import { ClientEndpointFactory } from "@/servers/fixtures/test-connection-endpoint-factories";
import { ClientTestHarness } from "@/test-utils/client-test-harness";
import { TimeMachine } from "@/test-utils/time-machine";
import {
  ClientIntentType,
  CombatantClass,
  FixedNumberGenerator,
  IndexedDbAssetStore,
  MonsterGenerator,
  RandomNumberGenerationPolicyFactory,
  RNG_RANGE,
  TEST_DUNGEON_SIMPLE,
} from "@speed-dungeon/common";
import fakeIndexedDB from "fake-indexeddb";
import { testToCharacterInParty } from "./test-to-character-in-party.js";

export async function enterTestGameSingleCharacter(
  clientEndpointFactory: ClientEndpointFactory,
  timeMachine: TimeMachine,
  gameName: string
) {
  const { lobbyIncomingConnectionGateway, gameServerIncomingConnectionGateway } =
    clientEndpointFactory.createIncomingConnectionGateways();

  const fixedRngMinRoll = new FixedNumberGenerator(RNG_RANGE.MIN);
  const rngPolicy = RandomNumberGenerationPolicyFactory.allFixedPolicy(RNG_RANGE.MAX, {
    counterAttack: fixedRngMinRoll,
    criticalStrike: fixedRngMinRoll,
  });

  const inMemoryTransportAndServers = await createTestServers(
    lobbyIncomingConnectionGateway,
    gameServerIncomingConnectionGateway,
    rngPolicy
  );

  const lobbyServer = inMemoryTransportAndServers.lobbyServer;
  const gameServer = inMemoryTransportAndServers.gameServer;

  const monsterGenerator = MonsterGenerator.createFromPolicy(rngPolicy);
  gameServer.dungeonGenerationPolicy.setFloors(TEST_DUNGEON_SIMPLE, monsterGenerator);

  const assetCache = new IndexedDbAssetStore(fakeIndexedDB);
  const tickScheduler = new ManualTickScheduler();
  const clientApplication = new ClientApplication(
    assetCache,
    `http://localhost:${TEST_LOBBY_SERVER_PORT}`,
    tickScheduler.scheduler
  );

  const { lobbyClientRef, gameClientRef } = clientApplication;

  await clientApplication.topologyManager.enterOnline(`http://localhost:${TEST_LOBBY_SERVER_PORT}`);
  timeMachine.start();
  const lobbyClientHarness = new ClientTestHarness(
    clientApplication,
    lobbyClientRef,
    tickScheduler,
    timeMachine
  );
  await testToCharacterInParty(
    lobbyClientHarness,
    clientApplication,
    CombatantClass.Warrior,
    gameName
  );
  await lobbyClientHarness.settleIntentResult({
    type: ClientIntentType.ToggleReadyToStartGame,
    data: undefined,
  });

  await clientApplication.sequentialEventProcessor.waitUntilIdle();
  await clientApplication.transitionToGameServer.waitFor();

  const gameClientHarness = new ClientTestHarness(
    clientApplication,
    gameClientRef,
    tickScheduler,
    timeMachine
  );

  return { lobbyServer, gameServer, clientApplication, gameClientHarness, lobbyClientHarness };
}
