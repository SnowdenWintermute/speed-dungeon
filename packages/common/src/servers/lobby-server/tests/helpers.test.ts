import { IdGenerator } from "../../../utility-classes/index.js";
import { InMemoryTransport } from "../../../transport/in-memory-transport.js";
import { SavedCharactersService } from "../../../servers/services/saved-characters.js";
import { IdentityProviderService } from "../../../servers/services/identity-provider.js";
import { LobbyServer } from "../index.js";
import { InMemoryIncomingConnectionGateway } from "../../in-memory-incoming-connection-gateway.js";
import { InMemoryGameSessionStoreService } from "../../services/game-session-store/in-memory-game-session-store-service.js";
import { InMemoryDisconnectedSessionStoreService } from "../../services/disconnected-session-store/in-memory-disconnected-session-store.js";
import { OpaqueEncryptionSessionClaimTokenCodec } from "../game-handoff/session-claim-token.js";
import { SodiumHelpers } from "../../../cryptography/index.js";
import { GameServer, GameServerExternalServices } from "../../game-server/index.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { DisconnectedSessionStoreService } from "../../services/disconnected-session-store/index.js";
import { RankedLadderService } from "../../services/ranked-ladder.js";
import { GameServerName } from "../../../aliases.js";
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

export const TEST_GAME_SERVER_NAME = "test game server name";

describe("placeholder", () => {
  it("placeholder", () => {
    //
  });
});

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TestHelpers {
  static async createInMemoryTransportWithTestServers() {
    const lobbyInMemoryTransport = new InMemoryTransport();
    const gameSessionStoreService = new InMemoryGameSessionStoreService();
    const disconnectedSessionStoreService = new InMemoryDisconnectedSessionStoreService();
    const savedCharactersService = new SavedCharactersService(
      new InMemorySavedCharacterSlotsPersistenceStrategy(),
      new InMemorySavedCharacterPersistenceStrategy()
    );
    const rankedLadderService = new InMemoryRankedLadderService();
    const raceGameRecordsService = new RaceGameRecordsService(
      new InMemoryRaceGameRecordsPersistenceStrategy()
    );

    const localLobbyInMemoryIncomingConnectionGateway = new InMemoryIncomingConnectionGateway(
      lobbyInMemoryTransport.getServerConnectionEndpointManager()
    );

    const testSecret = await SodiumHelpers.createSecret();
    const codec = new OpaqueEncryptionSessionClaimTokenCodec(testSecret);

    const lobbyServer = new LobbyServer(
      localLobbyInMemoryIncomingConnectionGateway,
      TestHelpers.createLobbyTestServices(
        gameSessionStoreService,
        disconnectedSessionStoreService,
        savedCharactersService,
        rankedLadderService
      ),
      codec
    );

    const gameServerInMemoryTransport = new InMemoryTransport();
    const localGameServerIncomingConnectionGateway = new InMemoryIncomingConnectionGateway(
      gameServerInMemoryTransport.getServerConnectionEndpointManager()
    );

    const gameServer = new GameServer(
      TEST_GAME_SERVER_NAME as GameServerName,
      localGameServerIncomingConnectionGateway,
      TestHelpers.createGameServerTestServices(
        gameSessionStoreService,
        disconnectedSessionStoreService,
        savedCharactersService,
        rankedLadderService,
        raceGameRecordsService
      ),
      codec
    );

    return { lobbyInMemoryTransport, gameServerInMemoryTransport, lobbyServer, gameServer };
  }

  private static createLobbyTestServices(
    gameSessionStoreService: GameSessionStoreService,
    disconnectedSessionStoreService: DisconnectedSessionStoreService,
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
      disconnectedSessionStoreService,
    };
    return externalServices;
  }

  private static createGameServerTestServices(
    gameSessionStoreService: GameSessionStoreService,
    disconnectedSessionStoreService: DisconnectedSessionStoreService,
    savedCharactersService: SavedCharactersService,
    rankedLadderService: RankedLadderService,
    raceGameRecordsService: RaceGameRecordsService
  ): GameServerExternalServices {
    const externalServices = {
      gameSessionStoreService,
      disconnectedSessionStoreService,
      savedCharactersService,
      rankedLadderService,
      raceGameRecordsService,
    };
    return externalServices;
  }
}
