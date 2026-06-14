import {
  AssetService,
  CrossServerBroadcasterService,
  GameServer,
  GameServerExternalServices,
  GameServerName,
  GameSessionStoreService,
  GameStateUpdate,
  IdentityProviderService,
  InMemoryConnectionEndpointServer,
  InMemoryConnectionEndpointServerRegistry,
  InMemoryCrossServerBroadcaster,
  InMemoryCrossServerBroadcastBus,
  InMemoryGameSessionStoreService,
  InMemoryIdentityProviderQueryStrategy,
  InMemoryIncomingConnectionGateway,
  InMemoryCharacterLevelLadderService,
  InMemorySpeedDungeonProfileService,
  LobbyServer,
  CharacterLevelLadderService,
  SodiumHelpers,
  SpeedDungeonProfileService,
  RandomDungeonGenerationPolicy,
  DefaultCharacterCreationPolicy,
  RandomNumberGenerationPolicyFactory,
  IdGeneratorRandom,
  cookieHeaderAuthSessionIdParser,
  ServerCommand,
  GlobalGameSessionStore,
  InMemoryGlobalGameSessionStore,
  OpaqueEncryptionTokenCodec,
  GameServerSessionClaimToken,
  GuestSessionReconnectionToken,
  UserGameDataPersistenceService,
  InMemorySavedCharacterPersistenceStrategy,
  InMemoryIronmanRunPersistenceStrategy,
} from "@speed-dungeon/common";

export function localServerUrl(port: number) {
  return `ws://localhost:${port}`;
}

export const LOCAL_OFFLINE_LOBBY_SERVER_PORT = 8080;
export const LOCAL_OFFLINE_LOBBY_SERVER_URL = localServerUrl(LOCAL_OFFLINE_LOBBY_SERVER_PORT);

export const LOCAL_OFFLINE_GAME_SERVER_PORT = 8090;
export const LOCAL_OFFLINE_GAME_SERVER_NAME = "Local Offline Game Server" as GameServerName;
export const LOCAL_OFFLINE_GAME_SERVER_URL = localServerUrl(LOCAL_OFFLINE_GAME_SERVER_PORT);

export async function createOfflineLocalServers(assetService: AssetService) {
  const lobbyConnectionEndpointServer = new InMemoryConnectionEndpointServer();
  InMemoryConnectionEndpointServerRegistry.singleton.registerServer(
    LOCAL_OFFLINE_LOBBY_SERVER_URL,
    lobbyConnectionEndpointServer
  );
  const lobbyIncomingConnectionGateway = new InMemoryIncomingConnectionGateway(
    lobbyConnectionEndpointServer
  );

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

  const profileService = new InMemorySpeedDungeonProfileService();
  const userGameDataPersistenceService = new UserGameDataPersistenceService(
    new InMemorySavedCharacterPersistenceStrategy(),
    new InMemoryIronmanRunPersistenceStrategy(),
    profileService
  );
  const characterLevelLadderService = new InMemoryCharacterLevelLadderService();

  const testSecret = await SodiumHelpers.createSecret();
  const gameServerSessionClaimCodec = new OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>(
    testSecret
  );
  const guestSessionReconnectionTokencodec =
    new OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>(testSecret);

  async function testLeastBusyServerUrlGetter() {
    return {
      name: LOCAL_OFFLINE_GAME_SERVER_NAME,
      url: localServerUrl(LOCAL_OFFLINE_GAME_SERVER_PORT),
    };
  }

  const lobbyServer = new LobbyServer(
    lobbyIncomingConnectionGateway,
    createOfflineLobbyServerServices(
      gameSessionStoreService,
      userGameDataPersistenceService,
      characterLevelLadderService,
      profileService,
      lobbyCrossServerBroadcasterService,
      globalGameSessionStore
    ),
    gameServerSessionClaimCodec,
    guestSessionReconnectionTokencodec,
    { [LOCAL_OFFLINE_GAME_SERVER_NAME]: LOCAL_OFFLINE_GAME_SERVER_URL },
    () => testLeastBusyServerUrlGetter(),
    DefaultCharacterCreationPolicy,
    RandomNumberGenerationPolicyFactory.allRandomPolicy(),
    new IdGeneratorRandom({ saveHistory: false }),
    cookieHeaderAuthSessionIdParser
  );

  const gameServerConnectionEndpointServer = new InMemoryConnectionEndpointServer();
  InMemoryConnectionEndpointServerRegistry.singleton.registerServer(
    LOCAL_OFFLINE_GAME_SERVER_URL,
    gameServerConnectionEndpointServer
  );
  const gameIncomingConnectionGateway = new InMemoryIncomingConnectionGateway(
    gameServerConnectionEndpointServer
  );

  const gameServer = new GameServer(
    LOCAL_OFFLINE_GAME_SERVER_NAME,
    gameIncomingConnectionGateway,
    createOfflineGameServerServices(
      gameSessionStoreService,
      userGameDataPersistenceService,
      characterLevelLadderService,
      assetService,
      gameCrossServerBroadcasterService,
      globalGameSessionStore,
      profileService
    ),
    gameServerSessionClaimCodec,
    guestSessionReconnectionTokencodec,
    RandomDungeonGenerationPolicy,
    RandomNumberGenerationPolicyFactory.allRandomPolicy(),
    new IdGeneratorRandom({ saveHistory: false }),
    cookieHeaderAuthSessionIdParser
  );

  await gameServer.analyzeAssetsForGameplayRelevantData();

  return { lobbyServer, gameServer };
}

function createOfflineLobbyServerServices(
  gameSessionStoreService: GameSessionStoreService,
  userGameDataPersistenceService: UserGameDataPersistenceService,
  characterLevelLadderService: CharacterLevelLadderService,
  profileService: SpeedDungeonProfileService,
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
  globalGameSessionStore: GlobalGameSessionStore
) {
  const identityProviderQueryStrategy = new InMemoryIdentityProviderQueryStrategy();

  // @TODO - set up the offline single player identity of the user
  //
  // identityProviderQueryStrategy.addIdentityWithPermenantAuthSession(
  //   TEST_AUTH_USERNAME_PLAYER_1,
  //   TEST_AUTH_SESSION_ID_PLAYER_1
  // );

  const identityProviderService = new IdentityProviderService(identityProviderQueryStrategy);

  const externalServices = {
    identityProviderService,
    profileService,
    userGameDataPersistenceService,
    characterLevelLadderService,
    gameSessionStoreService,
    crossServerBroadcasterService,
    globalGameSessionStore,
  };
  return externalServices;
}

function createOfflineGameServerServices(
  gameSessionStoreService: GameSessionStoreService,
  userGameDataPersistenceService: UserGameDataPersistenceService,
  characterLevelLadderService: CharacterLevelLadderService,
  assetService: AssetService,
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>,
  globalGameSessionStore: GlobalGameSessionStore,
  profileService: SpeedDungeonProfileService
) {
  const externalServices: GameServerExternalServices = {
    gameSessionStoreService,
    userGameDataPersistenceService,
    characterLevelLadderService,
    assetService,
    crossServerBroadcasterService,
    globalGameSessionStore,
    profileService,
  };
  return externalServices;
}
