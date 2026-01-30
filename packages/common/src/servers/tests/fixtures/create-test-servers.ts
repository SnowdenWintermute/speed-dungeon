import { SavedCharactersService } from "../../../servers/services/saved-characters.js";
import { InMemoryGameSessionStoreService } from "../../services/game-session-store/in-memory-game-session-store-service.js";
import { SodiumHelpers } from "../../../cryptography/index.js";
import { GameServer } from "../../game-server/index.js";
import { GameServerName } from "../../../aliases.js";
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
import {
  createGameServerTestServices,
  createLobbyTestServices,
  localServerUrl,
  TEST_GAME_SERVER_NAME,
  TEST_GAME_SERVER_PORT,
  TEST_GAME_SERVER_URL,
} from "./index.js";
import { IncomingConnectionGateway } from "../../incoming-connection-gateway.js";
import { InMemoryReconnectionForwardingStoreService } from "../../services/reconnection-forwarding-store/in-memory-reconnection-forwarding-store.js";
import { InMemorySpeedDungeonProfileService } from "../../services/in-memory-profiles-service.js";

export async function createTestServers(
  lobbyIncomingConnectionGateway: IncomingConnectionGateway,
  gameServerIncomingConnectionGateway: IncomingConnectionGateway
) {
  const gameSessionStoreService = new InMemoryGameSessionStoreService();
  const reconnectionForwardingStoreService = new InMemoryReconnectionForwardingStoreService();

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

  const testSecret = await SodiumHelpers.createSecret();
  const codec = new OpaqueEncryptionSessionClaimTokenCodec(testSecret);

  async function testLeastBusyServerUrlGetter() {
    return localServerUrl(TEST_GAME_SERVER_PORT);
  }

  const lobbyServer = new LobbyServer(
    lobbyIncomingConnectionGateway,
    createLobbyTestServices(
      gameSessionStoreService,
      reconnectionForwardingStoreService,
      savedCharactersService,
      rankedLadderService,
      profileService
    ),
    codec,
    { [TEST_GAME_SERVER_NAME]: TEST_GAME_SERVER_URL },
    () => testLeastBusyServerUrlGetter()
  );

  const gameServer = new GameServer(
    TEST_GAME_SERVER_NAME as GameServerName,
    gameServerIncomingConnectionGateway,
    createGameServerTestServices(
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
