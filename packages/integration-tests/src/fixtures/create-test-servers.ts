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
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySavedCharacterSlotsPersistenceStrategy,
  InMemorySpeedDungeonProfileService,
  LobbyServer,
  RaceGameRecordsService,
  SavedCharactersService,
  SodiumHelpers,
  ScriptedDungeonGenerationPolicy,
  RandomNumberGenerationPolicy,
  CrossServerBroadcasterService,
  GameSessionStoreService,
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
  ServerCommand,
  InMemoryGlobalGameSessionStore,
  OpaqueEncryptionTokenCodec,
  GameServerSessionClaimToken,
  GuestSessionReconnectionToken,
  GlobalGameSessionStore,
} from "@speed-dungeon/common";
import { NodeFileSystemAssetStore } from "@speed-dungeon/server";
import {
  TEST_GAME_SERVER_NAME,
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_AUTH_USERNAME_PLAYER_1,
  TEST_AUTH_USERNAME_PLAYER_2,
  localServerUrl,
  TEST_AUTH_SESSION_ID_PLAYER_3,
  TEST_AUTH_USERNAME_PLAYER_3,
} from "./consts";

export async function createTestServers(
  lobbyIncomingConnectionGateway: IncomingConnectionGateway,
  gameServerIncomingConnectionGateway: IncomingConnectionGateway,
  testGameServerPort: number,
  rngPolicy: RandomNumberGenerationPolicy,
  characterCreationPolicyConstructor: CharacterCreationPolicyConstructor = DefaultCharacterCreationPolicy
) {
  const gameSessionStoreService = new InMemoryGameSessionStoreService();
  const globalGameSessionStore = new InMemoryGlobalGameSessionStore();

  const crossServerBroadcastBus = new InMemoryCrossServerBroadcastBus<
    GameStateUpdate,
    ServerCommand
  >();
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
  const gameServerSessionClaimCodec = new OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>(
    testSecret
  );
  const guestSessionReconnectionTokencodec =
    new OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>(testSecret);

  async function testLeastBusyServerUrlGetter() {
    return { name: TEST_GAME_SERVER_NAME, url: localServerUrl(testGameServerPort) };
  }

  const lobbyServer = new LobbyServer(
    lobbyIncomingConnectionGateway,
    createLobbyTestServices(
      gameSessionStoreService,
      savedCharactersService,
      rankedLadderService,
      profileService,
      lobbyCrossServerBroadcasterService,
      globalGameSessionStore
    ),
    gameServerSessionClaimCodec,
    guestSessionReconnectionTokencodec,
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
      savedCharactersService,
      rankedLadderService,
      raceGameRecordsService,
      gameServerNodeAssetService,
      gameCrossServerBroadcasterService,
      globalGameSessionStore
    ),
    gameServerSessionClaimCodec,
    guestSessionReconnectionTokencodec,
    ScriptedDungeonGenerationPolicy,
    rngPolicy,
    new IdGeneratorSequential({ saveHistory: false, prefix: "gid" }),
    queryParamsAuthSessionIdParser
  );

  return { lobbyServer, gameServer, rankedLadderService };
}

export function createLobbyTestServices(
  gameSessionStoreService: GameSessionStoreService,
  savedCharactersService: SavedCharactersService,
  rankedLadderService: RankedLadderService,
  profileService: SpeedDungeonProfileService,
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
  globalGameSessionStore: GlobalGameSessionStore
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

  identityProviderQueryStrategy.addIdentityWithPermenantAuthSession(
    TEST_AUTH_USERNAME_PLAYER_3,
    TEST_AUTH_SESSION_ID_PLAYER_3
  );

  const identityProviderService = new IdentityProviderService(identityProviderQueryStrategy);

  const externalServices = {
    identityProviderService,
    profileService,
    savedCharactersService,
    rankedLadderService,
    idGenerator: new IdGeneratorSequential({ saveHistory: false }),
    gameSessionStoreService,
    crossServerBroadcasterService,
    globalGameSessionStore,
  };
  return externalServices;
}

export function createGameServerTestServices(
  gameSessionStoreService: GameSessionStoreService,
  savedCharactersService: SavedCharactersService,
  rankedLadderService: RankedLadderService,
  raceGameRecordsService: RaceGameRecordsService,
  assetService: AssetService,
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
  globalGameSessionStore: GlobalGameSessionStore
): GameServerExternalServices {
  const externalServices = {
    gameSessionStoreService,
    savedCharactersService,
    rankedLadderService,
    raceGameRecordsService,
    assetService,
    crossServerBroadcasterService,
    globalGameSessionStore,
  };
  return externalServices;
}
