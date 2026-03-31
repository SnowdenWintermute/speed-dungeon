import {
  GameServer,
  GameServerName,
  GameServerNodeAssetService,
  IncomingConnectionGateway,
  InMemoryGameSessionStoreService,
  InMemoryRaceGameRecordsPersistenceStrategy,
  InMemoryRankedLadderService,
  InMemoryReconnectionForwardingStoreService,
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySavedCharacterSlotsPersistenceStrategy,
  InMemorySpeedDungeonProfileService,
  LobbyServer,
  OpaqueEncryptionSessionClaimTokenCodec,
  RaceGameRecordsService,
  SavedCharactersService,
  SodiumHelpers,
} from "@speed-dungeon/common";
import {
  createGameServerTestServices,
  createLobbyTestServices,
  localServerUrl,
  TEST_GAME_SERVER_NAME,
  TEST_GAME_SERVER_PORT,
  TEST_GAME_SERVER_URL,
} from "./index.js";
import { NodeFileSystemAssetStore } from "@speed-dungeon/server";
import { ScriptedDungeonGenerationPolicy } from "@speed-dungeon/common";

export async function createTestServers(
  lobbyIncomingConnectionGateway: IncomingConnectionGateway,
  gameServerIncomingConnectionGateway: IncomingConnectionGateway
) {
  const gameSessionStoreService = new InMemoryGameSessionStoreService();
  const reconnectionForwardingStoreService = new InMemoryReconnectionForwardingStoreService();

  const characterSlotsPersistenceStrategy = new InMemorySavedCharacterSlotsPersistenceStrategy();
  const savedCharactersService = new SavedCharactersService(
    characterSlotsPersistenceStrategy,
    new InMemorySavedCharacterPersistenceStrategy()
  );
  const rankedLadderService = new InMemoryRankedLadderService();
  const raceGameRecordsService = new RaceGameRecordsService(
    new InMemoryRaceGameRecordsPersistenceStrategy()
  );

  const profileService = new InMemorySpeedDungeonProfileService(characterSlotsPersistenceStrategy);

  const baseAssetDirectory = "packages/server/assets/";
  const localFileSystemStore = new NodeFileSystemAssetStore(baseAssetDirectory);
  const gameServerNodeAssetService = new GameServerNodeAssetService(localFileSystemStore);

  const testSecret = await SodiumHelpers.createSecret();
  const codec = new OpaqueEncryptionSessionClaimTokenCodec(testSecret);

  async function testLeastBusyServerUrlGetter() {
    return localServerUrl(TEST_GAME_SERVER_PORT);
  }

  const lobbyServer = new LobbyServer(
    lobbyIncomingConnectionGateway,
    createLobbyTestServices(
      gameSessionStoreService,
      reconnectionForwardingStoreService,
      savedCharactersService,
      rankedLadderService,
      profileService
    ),
    codec,
    { [TEST_GAME_SERVER_NAME]: TEST_GAME_SERVER_URL },
    () => testLeastBusyServerUrlGetter()
  );

  const gameServer = new GameServer(
    TEST_GAME_SERVER_NAME as GameServerName,
    gameServerIncomingConnectionGateway,
    createGameServerTestServices(
      gameSessionStoreService,
      reconnectionForwardingStoreService,
      savedCharactersService,
      rankedLadderService,
      raceGameRecordsService,
      gameServerNodeAssetService
    ),
    codec,
    ScriptedDungeonGenerationPolicy
  );

  return { lobbyServer, gameServer };
}
