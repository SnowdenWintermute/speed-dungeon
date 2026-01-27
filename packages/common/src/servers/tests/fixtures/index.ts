import { IdGenerator } from "../../../utility-classes/index.js";
import { SavedCharactersService } from "../../../servers/services/saved-characters.js";
import { IdentityProviderService } from "../../../servers/services/identity-provider.js";
import { GameServerExternalServices } from "../../game-server/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { ReconnectionForwardingStoreService } from "../../services/disconnected-session-store/index.js";
import { RankedLadderService } from "../../services/ranked-ladder.js";
import { ConnectionId } from "../../../aliases.js";
import { RaceGameRecordsService } from "../../services/race-game-records.js";
import { InMemorySpeedDungeonProfileService } from "../../services/in-memory-profiles-service.js";
import { InMemorySavedCharacterSlotsPersistenceStrategy } from "../../services/in-memory-saved-characters-service.js";
import { InMemoryIdentityProviderQueryStrategy } from "../../services/in-memory-identity-provider-service.js";

export const TEST_GAME_SERVER_NAME = "Lindblum Test Server";
export const TEST_LOBBY_SERVER_PORT = 8090;
export const TEST_GAME_SERVER_PORT = 8091;
export const TEST_LOBBY_URL = localServerUrl(TEST_LOBBY_SERVER_PORT);
export const TEST_GAME_SERVER_URL = localServerUrl(TEST_GAME_SERVER_PORT);
/** Clients don't need to know their connection id */
export const CLIENT_CONNECTION_ENDPOINT_NIL_ID = "" as ConnectionId;

export function localServerUrl(port: number) {
  return `ws://localhost:${port}`;
}

export function createLobbyTestServices(
  gameSessionStoreService: GameSessionStoreService,
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
  savedCharactersService: SavedCharactersService,
  rankedLadderService: RankedLadderService
) {
  const identityProviderQueryStrategy = new InMemoryIdentityProviderQueryStrategy(0);
  const identityProviderService = new IdentityProviderService(identityProviderQueryStrategy);

  const characterSlotsPersistenceStrategy = new InMemorySavedCharacterSlotsPersistenceStrategy();
  const profileService = new InMemorySpeedDungeonProfileService(characterSlotsPersistenceStrategy);

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
  raceGameRecordsService: RaceGameRecordsService
): GameServerExternalServices {
  const externalServices = {
    gameSessionStoreService,
    reconnectionForwardingStoreService,
    savedCharactersService,
    rankedLadderService,
    raceGameRecordsService,
  };
  return externalServices;
}
