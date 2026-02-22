import { IdGenerator } from "../../../utility-classes/index.js";
import { SavedCharactersService } from "../../../servers/services/saved-characters.js";
import { IdentityProviderService } from "../../../servers/services/identity-provider.js";
import { GameServerExternalServices } from "../../game-server/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { ReconnectionForwardingStoreService } from "../../services/reconnection-forwarding-store/index.js";
import { RankedLadderService } from "../../services/ranked-ladder.js";
import { ConnectionId, GameServerName, Username } from "../../../aliases.js";
import { RaceGameRecordsService } from "../../services/race-game-records.js";
import { InMemoryIdentityProviderQueryStrategy } from "../../services/in-memory-identity-provider-service.js";
import { SpeedDungeonProfileService } from "../../services/profiles.js";
import { AssetService } from "../../services/assets/index.js";

export const TEST_GAME_SERVER_NAME = "Lindblum Test Server" as GameServerName;
export const TEST_LOBBY_SERVER_PORT = 8090;
export const TEST_GAME_SERVER_PORT = 8091;
export const TEST_LOBBY_URL = localServerUrl(TEST_LOBBY_SERVER_PORT);
export const TEST_GAME_SERVER_URL = localServerUrl(TEST_GAME_SERVER_PORT);
/** Clients don't need to know their connection id */
export const CLIENT_CONNECTION_ENDPOINT_NIL_ID = "" as ConnectionId;

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
    idGenerator: new IdGenerator({ saveHistory: false }),
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
