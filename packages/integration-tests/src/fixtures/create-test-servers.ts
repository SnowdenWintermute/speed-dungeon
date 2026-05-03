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
  SavedCharactersService,
  SodiumHelpers,
  ScriptedDungeonGenerationPolicy,
  RandomNumberGenerationPolicy,
  CrossServerBroadcasterService,
  GameSessionStoreService,
  ReconnectionForwardingStoreService,
  RankedLadderService,
  SpeedDungeonProfileService,
  InMemoryIdentityProviderQueryStrategy,
  IdentityProviderService,
  GameServerExternalServices,
  AssetService,
  queryParamsAuthSessionIdParser,
  GameStateUpdate,
  InMemoryCrossServerBroadcaster,
  InMemoryCrossServerBroadcastBus,
} from "@speed-dungeon/common";
import { NodeFileSystemAssetStore } from "@speed-dungeon/server";
import {
  TEST_GAME_SERVER_NAME,
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_AUTH_USERNAME_PLAYER_1,
  TEST_AUTH_USERNAME_PLAYER_2,
  localServerUrl,
} from "./consts";

export async function createTestServers(
  lobbyIncomingConnectionGateway: IncomingConnectionGateway,
  gameServerIncomingConnectionGateway: IncomingConnectionGateway,
  testGameServerPort: number,
  rngPolicy: RandomNumberGenerationPolicy,
  characterCreationPolicyConstructor: CharacterCreationPolicyConstructor = DefaultCharacterCreationPolicy
) {
  const gameSessionStoreService = new InMemoryGameSessionStoreService();
  const reconnectionForwardingStoreService = new InMemoryReconnectionForwardingStoreService();

  const crossServerBroadcastBus = new InMemoryCrossServerBroadcastBus<GameStateUpdate>();
  const lobbyCrossServerBroadcasterService = new InMemoryCrossServerBroadcaster(
    crossServerBroadcastBus
  );
  const gameCrossServerBroadcasterService = new InMemoryCrossServerBroadcaster(
    crossServerBroadcastBus
  );

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
    return localServerUrl(testGameServerPort);
  }

  const lobbyServer = new LobbyServer(
    lobbyIncomingConnectionGateway,
    createLobbyTestServices(
      gameSessionStoreService,
      reconnectionForwardingStoreService,
      savedCharactersService,
      rankedLadderService,
      profileService,
      lobbyCrossServerBroadcasterService
    ),
    codec,
    { [TEST_GAME_SERVER_NAME]: localServerUrl(testGameServerPort) },
    () => testLeastBusyServerUrlGetter(),
    characterCreationPolicyConstructor,
    rngPolicy,
    // must use sequential ids for deterministic turn ordering since id is used as tiebreaker
    new IdGeneratorSequential({ saveHistory: false, prefix: "lid" }),
    queryParamsAuthSessionIdParser
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
      gameServerNodeAssetService,
      gameCrossServerBroadcasterService
    ),
    codec,
    ScriptedDungeonGenerationPolicy,
    rngPolicy,
    new IdGeneratorSequential({ saveHistory: false, prefix: "gid" }),
    queryParamsAuthSessionIdParser
  );

  return { lobbyServer, gameServer };
}

export function createLobbyTestServices(
  gameSessionStoreService: GameSessionStoreService,
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
  savedCharactersService: SavedCharactersService,
  rankedLadderService: RankedLadderService,
  profileService: SpeedDungeonProfileService,
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate>
) {
  const identityProviderQueryStrategy = new InMemoryIdentityProviderQueryStrategy();

  identityProviderQueryStrategy.addIdentityWithPermenantAuthSession(
    TEST_AUTH_USERNAME_PLAYER_1,
    TEST_AUTH_SESSION_ID_PLAYER_1
  );

  identityProviderQueryStrategy.addIdentityWithPermenantAuthSession(
    TEST_AUTH_USERNAME_PLAYER_2,
    TEST_AUTH_SESSION_ID_PLAYER_2
  );

  const identityProviderService = new IdentityProviderService(identityProviderQueryStrategy);

  const externalServices = {
    identityProviderService,
    profileService,
    savedCharactersService,
    rankedLadderService,
    idGenerator: new IdGeneratorSequential({ saveHistory: false }),
    gameSessionStoreService,
    reconnectionForwardingStoreService,
    crossServerBroadcasterService,
  };
  return externalServices;
}

export function createGameServerTestServices(
  gameSessionStoreService: GameSessionStoreService,
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
  savedCharactersService: SavedCharactersService,
  rankedLadderService: RankedLadderService,
  raceGameRecordsService: RaceGameRecordsService,
  assetService: AssetService,
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate>
): GameServerExternalServices {
  const externalServices = {
    gameSessionStoreService,
    reconnectionForwardingStoreService,
    savedCharactersService,
    rankedLadderService,
    raceGameRecordsService,
    assetService,
    crossServerBroadcasterService,
  };
  return externalServices;
}
