import {
  CharacterCreationPolicyConstructor,
  DefaultCharacterCreationPolicy,
  GameServer,
  GameServerNodeAssetService,
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
  iterateNumericEnumKeyedRecord,
  GameServerName,
  UserGameDataPersistenceService,
  InMemoryIronmanRunPersistenceStrategy,
  LadderGameRecordsService,
  InMemoryLadderRecordsPersistenceStrategy,
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
    {
      [TEST_GAME_SERVER_NAME_STRINGS[TestGameServerName.Lindblum]]: localServerUrl(
        gameServerGatewaysAndPorts[TestGameServerName.Lindblum].port
      ),
      [TEST_GAME_SERVER_NAME_STRINGS[TestGameServerName.Alexandria]]: localServerUrl(
        gameServerGatewaysAndPorts[TestGameServerName.Alexandria].port
      ),
    },
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
      ([testGameServerName, { incomingConnectionGateway }]) => [
        testGameServerName,
        new GameServer(
          TEST_GAME_SERVER_NAME_STRINGS[testGameServerName],
          incomingConnectionGateway,
          createGameServerTestServices(
            gameSessionStoreService,
            userGameDataPersistenceService,
            rankedLadderService,
            ladderGameRecordsService,
            gameServerNodeAssetService,
            new InMemoryCrossServerBroadcaster(crossServerBroadcastBus),
            globalGameSessionStore,
            profileService
          ),
          gameServerSessionClaimCodec,
          guestSessionReconnectionTokencodec,
          ScriptedDungeonGenerationPolicy,
          rngPolicy,
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
  assetService: AssetService,
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
  globalGameSessionStore: GlobalGameSessionStore,
  profileService: SpeedDungeonProfileService
): GameServerExternalServices {
  const externalServices = {
    gameSessionStoreService,
    userGameDataPersistenceService,
    characterLevelLadderService,
    ladderGameRecordsService,
    assetService,
    crossServerBroadcasterService,
    globalGameSessionStore,
    profileService,
  };

  return externalServices;
}
