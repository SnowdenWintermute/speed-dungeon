import {
  AssetService,
  GameServer,
  GameServerExternalServices,
  GameServerName,
  GameSessionStoreService,
  IdentityProviderService,
  IdGenerator,
  InMemoryConnectionEndpointServer,
  InMemoryConnectionEndpointServerRegistry,
  InMemoryGameSessionStoreService,
  InMemoryIdentityProviderQueryStrategy,
  InMemoryIncomingConnectionGateway,
  InMemoryRaceGameRecordsPersistenceStrategy,
  InMemoryRankedLadderService,
  InMemoryReconnectionForwardingStoreService,
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySavedCharacterSlotsPersistenceStrategy,
  InMemorySpeedDungeonProfileService,
  LobbyServer,
  OpaqueEncryptionSessionClaimTokenCodec,
  RaceGameRecordsService,
  RankedLadderService,
  ReconnectionForwardingStoreService,
  SavedCharactersService,
  SodiumHelpers,
  SpeedDungeonProfileService,
  RandomDungeonGenerationPolicy,
  DefaultCharacterCreationPolicy,
  RandomNumberGenerationPolicyFactory,
} from "@speed-dungeon/common";

export function localServerUrl(port: number) {
  return `ws://localhost:${port}`;
}

export const LOCAL_OFFLINE_LOBBY_SERVER_PORT = 8080;
export const LOCAL_OFFLINE_LOBBY_SERVER_URL = localServerUrl(LOCAL_OFFLINE_LOBBY_SERVER_PORT);

export const LOCAL_OFFLINE_GAME_SERVER_PORT = 8090;
export const LOCAL_OFFLINE_GAME_SERVER_NAME =
  "Lindblum Test Server (local offline)" as GameServerName;
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
  const reconnectionForwardingStoreService = new InMemoryReconnectionForwardingStoreService();

  const characterSlotsPersistenceStrategy = new InMemorySavedCharacterSlotsPersistenceStrategy();
  const savedCharactersService = new SavedCharactersService(
    characterSlotsPersistenceStrategy,
    new InMemorySavedCharacterPersistenceStrategy()
  );
  const rankedLadderService = new InMemoryRankedLadderService();

  const profileService = new InMemorySpeedDungeonProfileService(characterSlotsPersistenceStrategy);

  const testSecret = await SodiumHelpers.createSecret();
  const codec = new OpaqueEncryptionSessionClaimTokenCodec(testSecret);

  async function testLeastBusyServerUrlGetter() {
    return localServerUrl(LOCAL_OFFLINE_GAME_SERVER_PORT);
  }

  const lobbyServer = new LobbyServer(
    lobbyIncomingConnectionGateway,
    createOfflineLobbyServerServices(
      gameSessionStoreService,
      reconnectionForwardingStoreService,
      savedCharactersService,
      rankedLadderService,
      profileService
    ),
    codec,
    { [LOCAL_OFFLINE_GAME_SERVER_NAME]: LOCAL_OFFLINE_GAME_SERVER_URL },
    () => testLeastBusyServerUrlGetter(),
    DefaultCharacterCreationPolicy,
    RandomNumberGenerationPolicyFactory.allRandomPolicy()
  );

  const gameServerConnectionEndpointServer = new InMemoryConnectionEndpointServer();
  InMemoryConnectionEndpointServerRegistry.singleton.registerServer(
    LOCAL_OFFLINE_GAME_SERVER_URL,
    gameServerConnectionEndpointServer
  );
  const gameIncomingConnectionGateway = new InMemoryIncomingConnectionGateway(
    gameServerConnectionEndpointServer
  );

  const raceGameRecordsPersistenceStrategy = new InMemoryRaceGameRecordsPersistenceStrategy();
  const raceGameRecordsService = new RaceGameRecordsService(raceGameRecordsPersistenceStrategy);

  const gameServer = new GameServer(
    LOCAL_OFFLINE_GAME_SERVER_NAME,
    gameIncomingConnectionGateway,
    createOfflineGameServerServices(
      gameSessionStoreService,
      reconnectionForwardingStoreService,
      savedCharactersService,
      rankedLadderService,
      raceGameRecordsService,
      assetService
    ),
    codec,
    RandomDungeonGenerationPolicy,
    RandomNumberGenerationPolicyFactory.allRandomPolicy()
  );

  await gameServer.analyzeAssetsForGameplayRelevantData();

  return { lobbyServer, gameServer };
}

function createOfflineLobbyServerServices(
  gameSessionStoreService: GameSessionStoreService,
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
  savedCharactersService: SavedCharactersService,
  rankedLadderService: RankedLadderService,
  profileService: SpeedDungeonProfileService
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
    savedCharactersService,
    rankedLadderService,
    idGenerator: new IdGenerator({ saveHistory: false }),
    gameSessionStoreService,
    reconnectionForwardingStoreService,
  };
  return externalServices;
}

function createOfflineGameServerServices(
  gameSessionStoreService: GameSessionStoreService,
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
  savedCharactersService: SavedCharactersService,
  rankedLadderService: RankedLadderService,
  raceGameRecordsService: RaceGameRecordsService,
  assetService: AssetService
) {
  const externalServices: GameServerExternalServices = {
    gameSessionStoreService,
    reconnectionForwardingStoreService,
    savedCharactersService,
    rankedLadderService,
    raceGameRecordsService,
    assetService,
  };
  return externalServices;
}
