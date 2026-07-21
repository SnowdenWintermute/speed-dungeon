import {
  CharacterCreationPolicyConstructor,
  DefaultCharacterCreationPolicy,
  AssetServer,
  GameServerRegistry,
  GameServerStatus,
  InMemoryGameServerRegistry,
  GameServer,
  GameplayAssetFacts,
  IdGeneratorSequential,
  IncomingConnectionGateway,
  InMemoryGameSessionStoreService,
  InMemoryCharacterLevelLadderService,
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySpeedDungeonProfileService,
  LobbyServer,
  SodiumHelpers,
  ScriptedDungeonGenerationPolicy,
  RandomNumberGenerationPolicy,
  CrossServerBroadcasterService,
  GameSessionStoreService,
  CharacterLevelLadderService,
  SpeedDungeonProfileService,
  InMemoryIdentityProviderQueryStrategy,
  IdentityProviderService,
  GameServerExternalServices,
  queryParamsAuthSessionIdParser,
  GameStateUpdate,
  InMemoryCrossServerBroadcaster,
  InMemoryCrossServerBroadcastBus,
  ServerCommand,
  InMemoryUserGlobalGameSessionStore,
  OpaqueEncryptionTokenCodec,
  GameServerSessionClaimToken,
  GuestSessionReconnectionToken,
  UserGlobalGameSessionStore,
  iterateNumericEnumKeyedRecord,
  GameServerName,
  UserGameDataPersistenceService,
  InMemoryIronmanRunPersistenceStrategy,
  LadderGameRecordsService,
  InMemoryLadderRecordsPersistenceStrategy,
  ResourceChangePropertiesStrategy,
} from "@speed-dungeon/common";
import { NodeFileSystemAssetStore } from "@speed-dungeon/server";
import {
  TEST_AUTH_SESSION_ID_PLAYER_1,
  TEST_AUTH_SESSION_ID_PLAYER_2,
  TEST_AUTH_USERNAME_PLAYER_1,
  TEST_AUTH_USERNAME_PLAYER_2,
  localServerUrl,
  TEST_AUTH_SESSION_ID_PLAYER_3,
  TEST_AUTH_USERNAME_PLAYER_3,
  TestGameServerName,
  TEST_GAME_SERVER_NAME_STRINGS,
} from "./consts";

const TEST_ASSET_DIRECTORY = "packages/server/assets/";

let cachedFactsOption: null | GameplayAssetFacts = null;

async function getTestGameplayAssetFacts() {
  if (cachedFactsOption === null) {
    const assetServer = new AssetServer(new NodeFileSystemAssetStore(TEST_ASSET_DIRECTORY));
    await assetServer.initialize();
    cachedFactsOption = (await assetServer.getGameplayAssetFacts()).facts;
  }

  return cachedFactsOption;
}

export async function createTestServers(
  lobbyIncomingConnectionGateway: IncomingConnectionGateway,
  gameServerGatewaysAndPorts: Record<
    TestGameServerName,
    {
      incomingConnectionGateway: IncomingConnectionGateway;
      port: number;
    }
  >,
  leastBusyGameServerGetterRef: { getter: () => Promise<{ name: GameServerName; url: string }> },
  rngPolicy: RandomNumberGenerationPolicy,
  resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy,
  characterCreationPolicyConstructor: CharacterCreationPolicyConstructor = DefaultCharacterCreationPolicy
) {
  const gameSessionStoreService = new InMemoryGameSessionStoreService();
  const globalGameSessionStore = new InMemoryUserGlobalGameSessionStore();

  const crossServerBroadcastBus = new InMemoryCrossServerBroadcastBus<
    GameStateUpdate,
    ServerCommand
  >();
  const lobbyCrossServerBroadcasterService = new InMemoryCrossServerBroadcaster(
    crossServerBroadcastBus
  );

  const profileService = new InMemorySpeedDungeonProfileService();
  const userGameDataPersistenceService = new UserGameDataPersistenceService(
    new InMemorySavedCharacterPersistenceStrategy(),
    new InMemoryIronmanRunPersistenceStrategy(),
    profileService
  );
  const rankedLadderService = new InMemoryCharacterLevelLadderService();
  const ladderGameRecordsService = new LadderGameRecordsService(
    new InMemoryLadderRecordsPersistenceStrategy(),
    new IdGeneratorSequential({ saveHistory: false, prefix: "ladder-record-id" })
  );

  const gameplayAssetFacts = await getTestGameplayAssetFacts();

  const gameServerRegistry = new InMemoryGameServerRegistry();
  for (const [testGameServerName, { port }] of iterateNumericEnumKeyedRecord(
    gameServerGatewaysAndPorts
  )) {
    await gameServerRegistry.register(
      new GameServerStatus(TEST_GAME_SERVER_NAME_STRINGS[testGameServerName], localServerUrl(port))
    );
  }

  const testSecret = await SodiumHelpers.createSecret();
  const gameServerSessionClaimCodec = new OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>(
    testSecret
  );
  const guestSessionReconnectionTokencodec =
    new OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>(testSecret);

  async function testLeastBusyServerUrlGetter() {
    return {
      name: TEST_GAME_SERVER_NAME_STRINGS[TestGameServerName.Lindblum] as GameServerName,
      url: localServerUrl(gameServerGatewaysAndPorts[TestGameServerName.Lindblum].port),
    };
  }

  leastBusyGameServerGetterRef.getter = testLeastBusyServerUrlGetter;

  const { externalServices: lobbyExternalServices, identityProviderQueryStrategy } =
    createLobbyTestServices(
      gameSessionStoreService,
      userGameDataPersistenceService,
      rankedLadderService,
      ladderGameRecordsService,
      profileService,
      lobbyCrossServerBroadcasterService,
      globalGameSessionStore
    );

  const lobbyServer = new LobbyServer(
    lobbyIncomingConnectionGateway,
    lobbyExternalServices,
    gameServerSessionClaimCodec,
    guestSessionReconnectionTokencodec,
    gameServerRegistry,
    async () => {
      return leastBusyGameServerGetterRef.getter();
    },
    characterCreationPolicyConstructor,
    rngPolicy,
    // must use sequential ids for deterministic turn ordering since id is used as tiebreaker
    new IdGeneratorSequential({ saveHistory: false, prefix: "lid" }),
    queryParamsAuthSessionIdParser
  );

  const gameServers = Object.fromEntries(
    iterateNumericEnumKeyedRecord(gameServerGatewaysAndPorts).map(
      ([testGameServerName, { incomingConnectionGateway, port }]) => [
        testGameServerName,
        new GameServer(
          TEST_GAME_SERVER_NAME_STRINGS[testGameServerName],
          localServerUrl(port),
          incomingConnectionGateway,
          createGameServerTestServices(
            gameSessionStoreService,
            userGameDataPersistenceService,
            rankedLadderService,
            ladderGameRecordsService,
            gameServerRegistry,
            new InMemoryCrossServerBroadcaster(crossServerBroadcastBus),
            globalGameSessionStore,
            profileService
          ),
          gameServerSessionClaimCodec,
          guestSessionReconnectionTokencodec,
          gameplayAssetFacts,
          ScriptedDungeonGenerationPolicy,
          rngPolicy,
          resourceChangePropertiesStrategy,
          new IdGeneratorSequential({ saveHistory: false, prefix: "gid" }),
          queryParamsAuthSessionIdParser
        ),
      ]
    )
  ) as Record<TestGameServerName, GameServer>;

  return {
    lobbyServer,
    gameServers,
    rankedLadderService,
    ladderGameRecordsService,
    identityProviderQueryStrategy,
    userGameDataPersistenceService,
  };
}

export function createLobbyTestServices(
  gameSessionStoreService: GameSessionStoreService,
  userGameDataPersistenceService: UserGameDataPersistenceService,
  characterLevelLadderService: CharacterLevelLadderService,
  ladderGameRecordsService: LadderGameRecordsService,
  profileService: SpeedDungeonProfileService,
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
  globalGameSessionStore: UserGlobalGameSessionStore
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
    userGameDataPersistenceService,
    characterLevelLadderService,
    ladderGameRecordsService,
    idGenerator: new IdGeneratorSequential({ saveHistory: false }),
    gameSessionStoreService,
    crossServerBroadcasterService,
    globalGameSessionStore,
  };
  return { externalServices, identityProviderQueryStrategy };
}

export function createGameServerTestServices(
  gameSessionStoreService: GameSessionStoreService,
  userGameDataPersistenceService: UserGameDataPersistenceService,
  characterLevelLadderService: CharacterLevelLadderService,
  ladderGameRecordsService: LadderGameRecordsService,
  gameServerRegistry: GameServerRegistry,
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
  globalGameSessionStore: UserGlobalGameSessionStore,
  profileService: SpeedDungeonProfileService
): GameServerExternalServices {
  const externalServices = {
    gameSessionStoreService,
    userGameDataPersistenceService,
    characterLevelLadderService,
    ladderGameRecordsService,
    gameServerRegistry,
    crossServerBroadcasterService,
    globalGameSessionStore,
    profileService,
  };

  return externalServices;
}
