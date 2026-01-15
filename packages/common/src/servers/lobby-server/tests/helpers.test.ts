import { IdGenerator } from "../../../utility-classes/index.js";
import { InMemoryTransport } from "../../../transport/in-memory-transport.js";
import {
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySavedCharacterSlotsPersistenceStrategy,
} from "../../../servers/services/saved-characters.test.js";
import { SavedCharactersService } from "../../../servers/services/saved-characters.js";
import { InMemorySpeedDungeonProfileService } from "../../../servers/services/profiles.test.js";
import { IdentityProviderService } from "../../../servers/services/identity-provider.js";
import { FakeUsersIdentityProviderQueryStrategy } from "../../../servers/services/identity-provider.test.js";
import { InMemoryRankedLadderService } from "../../../servers/services/ranked-ladder.test.js";
import { LobbyServer } from "../index.js";
import { InMemoryIncomingConnectionGateway } from "../../in-memory-incoming-connection-gateway.js";
import { InMemoryGameSessionStoreService } from "../../services/game-session-store/in-memory-game-session-store-service.js";
import { InMemoryDisconnectedSessionStoreService } from "../../services/disconnected-session-store/in-memory-disconnected-session-store.js";
import { OpaqueEncryptionSessionClaimTokenCodec } from "../game-handoff/session-claim-token.js";
import { SodiumHelpers } from "../../../cryptography/index.js";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TestHelpers {
  static async createInMemoryTransportWithTestLobby() {
    const inMemoryTransport = new InMemoryTransport();

    const lobbyLocalClientIntentReceiver = new InMemoryIncomingConnectionGateway(
      inMemoryTransport.getServerConnectionEndpointManager()
    );

    const testSecret = await SodiumHelpers.createSecret();
    const codec = new OpaqueEncryptionSessionClaimTokenCodec(testSecret);

    const lobbyServer = new LobbyServer(
      lobbyLocalClientIntentReceiver,
      TestHelpers.createLobbyTestServices(),
      codec
    );

    return { inMemoryTransport, lobbyServer };
  }

  private static createLobbyTestServices() {
    const identityProviderQueryStrategy = new FakeUsersIdentityProviderQueryStrategy(0);
    const identityProviderService = new IdentityProviderService(identityProviderQueryStrategy);

    const characterSlotsPersistenceStrategy = new InMemorySavedCharacterSlotsPersistenceStrategy();
    const profileService = new InMemorySpeedDungeonProfileService(
      characterSlotsPersistenceStrategy
    );

    const savedCharactersService = new SavedCharactersService(
      new InMemorySavedCharacterSlotsPersistenceStrategy(),
      new InMemorySavedCharacterPersistenceStrategy()
    );

    const gameSessionStoreService = new InMemoryGameSessionStoreService();
    const disconnectedSessionStoreService = new InMemoryDisconnectedSessionStoreService();

    const rankedLadderService = new InMemoryRankedLadderService();
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
}
