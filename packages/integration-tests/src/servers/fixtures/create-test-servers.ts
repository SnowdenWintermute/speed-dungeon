import {
  CharacterCreationPolicyConstructor,
  DefaultCharacterCreationPolicy,
  GameServer,
  GameServerName,
  GameServerNodeAssetService,
  IdGeneratorSequential,
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
  RandomNumberGenerationPolicyFactory,
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
import {
  ScriptedDungeonGenerationPolicy,
  RandomNumberGenerationPolicy,
} from "@speed-dungeon/common";

export async function createTestServers(
  lobbyIncomingConnectionGateway: IncomingConnectionGateway,
  gameServerIncomingConnectionGateway: IncomingConnectionGateway,
  rngPolicy: RandomNumberGenerationPolicy,
  characterCreationPolicyConstructor: CharacterCreationPolicyConstructor = DefaultCharacterCreationPolicy
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
    () => testLeastBusyServerUrlGetter(),
    characterCreationPolicyConstructor,
    rngPolicy,
    // must use sequential ids for deterministic turn ordering since id is used as tiebreaker
    new IdGeneratorSequential({ saveHistory: false, prefix: "lid" })
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
    ScriptedDungeonGenerationPolicy,
    rngPolicy,
    new IdGeneratorSequential({ saveHistory: false, prefix: "gid" })
  );

  return { lobbyServer, gameServer };
}
