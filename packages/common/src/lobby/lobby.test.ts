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
import { Lobby } from "./index.js";

describe("Lobby", () => {
  it("is a test", async () => {
    // const lobby = new Lobby(createLobbyTestServices());

    // const outbox = await lobby.handleConnection(
    //   fakeTransportEndpoint(),
    //   {}
    // );

    expect(true).toBeTruthy();
  });
});

function createLobbyTestServices() {
  const identityProviderQueryStrategy = new FakeUsersIdentityProviderQueryStrategy();
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
