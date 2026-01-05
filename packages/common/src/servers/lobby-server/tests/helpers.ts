import { IdGenerator } from "../../../utility-classes/index.js";
import { InMemoryTransport } from "../../../transport/in-memory-transport.js";
import { LobbyLocalClientIntentReceiver } from "../../local-client-intent-receiver.js";
import { SpeedDungeonGame } from "../../../game/index.js";
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
import {
  GameServerConnectionInstructions,
  GameServerConnectionType,
} from "../game-handoff/connection-instructions.js";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TestHelpers {
  static createInMemoryTransportWithTestLobby() {
    const inMemoryTransport = new InMemoryTransport();

    const lobbyLocalClientIntentReceiver = new LobbyLocalClientIntentReceiver(
      inMemoryTransport.getServerConnectionEndpointManager()
    );

    const fakeGameHandoffStrategy = (game: SpeedDungeonGame): GameServerConnectionInstructions => {
      console.log("game handed off");
      return {
        type: GameServerConnectionType.Local,
      };
    };

    const lobbyServer = new LobbyServer(
      lobbyLocalClientIntentReceiver,
      {
        handoff: fakeGameHandoffStrategy,
      },
      TestHelpers.createLobbyTestServices()
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

    const rankedLadderService = new InMemoryRankedLadderService();
    const externalServices = {
      identityProviderService,
      profileService,
      savedCharactersService,
      rankedLadderService,
      idGenerator: new IdGenerator({ saveHistory: false }),
    };
    return externalServices;
  }
}
