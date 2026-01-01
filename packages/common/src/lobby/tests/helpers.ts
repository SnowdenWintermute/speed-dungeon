import { expect } from "vitest";
import { IdGenerator } from "../../utility-classes/index.js";
import { FakeUsersIdentityProviderQueryStrategy } from "../services/identity-provider.test.js";
import { IdentityProviderService } from "../services/identity-provider.js";
import { InMemorySpeedDungeonProfileService } from "../services/profiles.test.js";
import { SavedCharactersService } from "../services/saved-characters.js";
import { InMemoryRankedLadderService } from "../services/ranked-ladder.test.js";
import {
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySavedCharacterSlotsPersistenceStrategy,
} from "../services/saved-characters.test.js";
import { InMemoryTransport } from "../../transport/in-memory-transport.js";
import { LobbyLocalClientIntentReceiver } from "../local-client-intent-receiver.js";
import {
  GameSimulatorConnectionInstructions,
  GameSimulatorConnectionType,
} from "../game-simulator-handoff-strategy.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { Lobby } from "../index.js";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TestHelpers {
  static createInMemoryTransportWithTestLobby() {
    const inMemoryTransport = new InMemoryTransport();

    const lobbyLocalClientIntentReceiver = new LobbyLocalClientIntentReceiver(
      inMemoryTransport.getServerConnectionEndpointManager()
    );

    const fakeGameHandoffStrategy = (
      game: SpeedDungeonGame
    ): GameSimulatorConnectionInstructions => {
      console.log("game handed off");
      return {
        type: GameSimulatorConnectionType.Local,
      };
    };

    const lobby = new Lobby(
      lobbyLocalClientIntentReceiver,
      {
        handoff: fakeGameHandoffStrategy,
      },
      TestHelpers.createLobbyTestServices()
    );

    return { inMemoryTransport, lobby };
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
