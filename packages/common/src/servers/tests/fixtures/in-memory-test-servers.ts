import { SavedCharactersService } from "../../../servers/services/saved-characters.js";
import { InMemoryGameSessionStoreService } from "../../services/game-session-store/in-memory-game-session-store-service.js";
import { InMemoryReconnectionForwardingStoreService } from "../../services/disconnected-session-store/in-memory-disconnected-session-store.js";
import { SodiumHelpers } from "../../../cryptography/index.js";
import { GameServer } from "../../game-server/index.js";
import { ConnectionId, GameServerName } from "../../../aliases.js";
import {
  InMemoryRaceGameRecordsPersistenceStrategy,
  RaceGameRecordsService,
} from "../../services/race-game-records.js";
import {
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySavedCharacterSlotsPersistenceStrategy,
} from "../../services/in-memory-saved-characters-service.js";
import { InMemoryRankedLadderService } from "../../services/in-memory-ranked-ladder-service.js";
import { OpaqueEncryptionSessionClaimTokenCodec } from "../../lobby-server/game-handoff/session-claim-token.js";
import { LobbyServer } from "../../lobby-server/index.js";
import { NodeWebSocketIncomingConnectionGateway } from "../../node-websocket-incoming-connection-gateway.js";
import { WebSocketServer } from "ws";
import { TEST_LOBBY_URL, TestHelpers } from "./index.js";
import { InMemoryConnectionEndpointServer } from "../../../transport/in-memory-connection-endpoint-server.js";
import { InMemoryConnectionEndpointServerRegistry } from "../../../transport/in-memory-connection-endpoint-server-registry.js";

/** Clients don't need to know their connection id */
export const CLIENT_CONNECTION_ENDPOINT_NIL_ID = "" as ConnectionId;

export async function createInMemoryTestServers() {
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

  const inMemoryServerRegistry = new InMemoryConnectionEndpointServerRegistry();
  const lobbyConnectionEndpointServer = new InMemoryConnectionEndpointServer();
  inMemoryServerRegistry.registerServer(TEST_LOBBY_URL, lobbyConnectionEndpointServer);

  //
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
