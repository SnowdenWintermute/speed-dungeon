import {
  AssetService,
  GameServerExternalServices,
  GameServerName,
  GameSessionStoreService,
  IdentityProviderService,
  IdGeneratorSequential,
  InMemoryIdentityProviderQueryStrategy,
  RaceGameRecordsService,
  RankedLadderService,
  ReconnectionForwardingStoreService,
  SavedCharactersService,
  SpeedDungeonProfileService,
  Username,
} from "@speed-dungeon/common";

export const TEST_GAME_SERVER_NAME = "Lindblum Test Server" as GameServerName;
export const TEST_LOBBY_SERVER_PORT = 8190;
export const TEST_GAME_SERVER_PORT = 8191;
export const TEST_LOBBY_URL = localServerUrl(TEST_LOBBY_SERVER_PORT);
export const TEST_GAME_SERVER_URL = localServerUrl(TEST_GAME_SERVER_PORT);

export const TEST_GAME_NAME = "test-game-a";
export const TEST_PARTY_NAME = "test-party-a";

export const TEST_AUTH_SESSION_ID_PLAYER_1 = "0000";
export const TEST_AUTH_SESSION_ID_PLAYER_2 = "0001";
export const TEST_AUTH_USERNAME_PLAYER_1 = "TestUsername1" as Username;
export const TEST_AUTH_USERNAME_PLAYER_2 = "TestUsername2" as Username;

export function localServerUrl(port: number) {
  return `ws://localhost:${port}`;
}

export function createLobbyTestServices(
  gameSessionStoreService: GameSessionStoreService,
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
  savedCharactersService: SavedCharactersService,
  rankedLadderService: RankedLadderService,
  profileService: SpeedDungeonProfileService
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
  };
  return externalServices;
}

export function createGameServerTestServices(
  gameSessionStoreService: GameSessionStoreService,
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
  savedCharactersService: SavedCharactersService,
  rankedLadderService: RankedLadderService,
  raceGameRecordsService: RaceGameRecordsService,
  assetService: AssetService
): GameServerExternalServices {
  const externalServices = {
    gameSessionStoreService,
    reconnectionForwardingStoreService,
    savedCharactersService,
    rankedLadderService,
    raceGameRecordsService,
    assetService,
  };
  return externalServices;
}
