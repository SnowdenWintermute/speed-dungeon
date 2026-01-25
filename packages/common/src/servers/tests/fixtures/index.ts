import { IdGenerator } from "../../../utility-classes/index.js";
import { SavedCharactersService } from "../../../servers/services/saved-characters.js";
import { IdentityProviderService } from "../../../servers/services/identity-provider.js";
import { InMemoryGameSessionStoreService } from "../../services/game-session-store/in-memory-game-session-store-service.js";
import { InMemoryReconnectionForwardingStoreService } from "../../services/disconnected-session-store/in-memory-disconnected-session-store.js";
import { SodiumHelpers } from "../../../cryptography/index.js";
import { GameServer, GameServerExternalServices } from "../../game-server/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { ReconnectionForwardingStoreService } from "../../services/disconnected-session-store/index.js";
import { RankedLadderService } from "../../services/ranked-ladder.js";
import { ConnectionId, GameServerName } from "../../../aliases.js";
import {
  InMemoryRaceGameRecordsPersistenceStrategy,
  RaceGameRecordsService,
} from "../../services/race-game-records.js";
import { InMemorySpeedDungeonProfileService } from "../../services/in-memory-profiles-service.js";
import {
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySavedCharacterSlotsPersistenceStrategy,
} from "../../services/in-memory-saved-characters-service.js";
import { InMemoryRankedLadderService } from "../../services/in-memory-ranked-ladder-service.js";
import { InMemoryIdentityProviderQueryStrategy } from "../../services/in-memory-identity-provider-service.js";
import { OpaqueEncryptionSessionClaimTokenCodec } from "../../lobby-server/game-handoff/session-claim-token.js";
import { LobbyServer } from "../../lobby-server/index.js";
import { NodeWebSocketIncomingConnectionGateway } from "../../node-websocket-incoming-connection-gateway.js";
import { WebSocketServer } from "ws";

export const TEST_GAME_SERVER_NAME = "test game server name";
export const TEST_LOBBY_SERVER_PORT = 8090;
export const TEST_GAME_SERVER_PORT = 8091;
export const TEST_LOBBY_URL = localServerUrl(TEST_LOBBY_SERVER_PORT);
/** Clients don't need to know their connection id */
export const CLIENT_CONNECTION_ENDPOINT_NIL_ID = "" as ConnectionId;

export function localServerUrl(port: number) {
  return `ws://localhost:${port}`;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TestHelpers {
  static async createTestServers() {
    const gameSessionStoreService = new InMemoryGameSessionStoreService();
    const reconnectionForwardingStoreService = new InMemoryReconnectionForwardingStoreService();
    const savedCharactersService = new SavedCharactersService(
      new InMemorySavedCharacterSlotsPersistenceStrategy(),
      new InMemorySavedCharacterPersistenceStrategy()
    );
    const rankedLadderService = new InMemoryRankedLadderService();
    const raceGameRecordsService = new RaceGameRecordsService(
      new InMemoryRaceGameRecordsPersistenceStrategy()
    );

    const lobbyWebSocketServer = new WebSocketServer({ port: TEST_LOBBY_SERVER_PORT });
    const lobbyIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(
      lobbyWebSocketServer
    );
    const testSecret = await SodiumHelpers.createSecret();
    const codec = new OpaqueEncryptionSessionClaimTokenCodec(testSecret);

    const lobbyServer = new LobbyServer(
      lobbyIncomingConnectionGateway,
      TestHelpers.createLobbyTestServices(
        gameSessionStoreService,
        reconnectionForwardingStoreService,
        savedCharactersService,
        rankedLadderService
      ),
      codec
    );

    const gameServerWebSocketServer = new WebSocketServer({ port: TEST_GAME_SERVER_PORT });
    const gameServerIncomingConnectionGateway = new NodeWebSocketIncomingConnectionGateway(
      gameServerWebSocketServer
    );

    const gameServer = new GameServer(
      TEST_GAME_SERVER_NAME as GameServerName,
      gameServerIncomingConnectionGateway,
      TestHelpers.createGameServerTestServices(
        gameSessionStoreService,
        reconnectionForwardingStoreService,
        savedCharactersService,
        rankedLadderService,
        raceGameRecordsService
      ),
      codec
    );

    return { lobbyServer, gameServer };
  }

  private static createLobbyTestServices(
    gameSessionStoreService: GameSessionStoreService,
    reconnectionForwardingStoreService: ReconnectionForwardingStoreService,
    savedCharactersService: SavedCharactersService,
    rankedLadderService: RankedLadderService
  ) {
    const identityProviderQueryStrategy = new InMemoryIdentityProviderQueryStrategy(0);
    const identityProviderService = new IdentityProviderService(identityProviderQueryStrategy);

    const characterSlotsPersistenceStrategy = new InMemorySavedCharacterSlotsPersistenceStrategy();
    const profileService = new InMemorySpeedDungeonProfileService(
      characterSlotsPersistenceStrategy
    );

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

  private static createGameServerTestServices(
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
}
