import { describe, it, expect } from "vitest";
import { IdentityProviderService } from "./services/identity-provider.js";
import { SavedCharactersService } from "./services/saved-characters.js";

import { InMemorySpeedDungeonProfileService } from "./services/profiles.test.js";
import { FakeUsersIdentityProviderQueryStrategy } from "./services/identity-provider.test.js";
import {
  InMemorySavedCharacterPersistenceStrategy,
  InMemorySavedCharacterSlotsPersistenceStrategy,
} from "./services/saved-characters.test.js";
import { InMemoryRankedLadderService } from "./services/ranked-ladder.test.js";
import { IdGenerator } from "../utility-classes/index.js";
import { LobbyLocalClientIntentReceiver } from "./local-client-intent-receiver.js";
import { ClientIntent } from "../packets/client-intents.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { Lobby } from "./index.js";
import { GameSimulatorConnectionType } from "./game-simulator-handoff-strategy.js";
import { GameName } from "../aliases.js";
import { GameMode } from "../types.js";
import { LocalConnectionEndpointManager } from "../transport/local-connection-endpoint-manager.js";
import { LocalConnectionFactory } from "../transport/local-connection-factory.js";

describe("Lobby", () => {
  it("is a test", async () => {
    const localServerConnectionEndpointManager = new LocalConnectionEndpointManager<
      GameStateUpdate,
      ClientIntent
    >();

    const lobbyLocalClientIntentReceiver = new LobbyLocalClientIntentReceiver(
      localServerConnectionEndpointManager
    );

    const localClientConnectionEndpointManager = new LocalConnectionEndpointManager<
      ClientIntent,
      GameStateUpdate
    >();

    const localConnectionFactory = new LocalConnectionFactory(
      localServerConnectionEndpointManager,
      localClientConnectionEndpointManager
    );

    const lobby = new Lobby(
      lobbyLocalClientIntentReceiver,
      {
        handoff: (game) => {
          console.log("game handed off");
          return {
            type: GameSimulatorConnectionType.Local,
          };
        },
      },
      createLobbyTestServices()
    );

    const { serverEndpoint, clientEndpoint } = await localConnectionFactory.create();

    const session = lobby.userSessionRegistry.getExpectedSession(serverEndpoint.id);

    const outbox = await lobby.gameLifecycleController.createGameHandler(
      { gameName: "my game name" as GameName, mode: GameMode.Race },
      session
    );

    console.log("create game outbox:", outbox.toDispatches());

    expect(true).toBeTruthy();
  });
});

function createLobbyTestServices() {
  const identityProviderQueryStrategy = new FakeUsersIdentityProviderQueryStrategy(0);
  const identityProviderService = new IdentityProviderService(identityProviderQueryStrategy);

  const characterSlotsPersistenceStrategy = new InMemorySavedCharacterSlotsPersistenceStrategy();
  const profileService = new InMemorySpeedDungeonProfileService(characterSlotsPersistenceStrategy);

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
