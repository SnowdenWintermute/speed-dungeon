import { describe, it, expect } from "vitest";
import { IdentityProviderId } from "../aliases.js";
import { InMemorySpeedDungeonProfileService } from "./services/profiles.test.js";

describe("Lobby", () => {
  it("is a test", async () => {
    // const lobby = createTestLobby();

    // const outbox = await lobby.handleConnection(
    //   fakeTransportEndpoint(),
    //   {}
    // );

    expect(true).toBeTruthy();
  });
});

function createLobbyTestServices() {
  const profileService = new InMemorySpeedDungeonProfileService();
  //   const savedCharactersPersistenceStrategy = new DatabaseSavedCharacterPersistenceStrategy(
  //     playerCharactersRepo
  //   );
  //   const savedCharacterSlotsPersistenceStrategy =
  //     new DatabaseSavedCharacterSlotsPersistenceStrategy(characterSlotsRepo);
  //   const savedCharactersService = new SavedCharactersService(
  //     savedCharacterSlotsPersistenceStrategy,
  //     savedCharactersPersistenceStrategy
  //   );
  //   const identityProviderService = new IdentityProviderService({
  //     execute: async (context: IdentityResolutionContext) => {
  //       return await getLoggedInUserOrCreateGuest(context.cookies);
  //     },
  //   });
  //   const rankedLadderService = new DatabaseRankedLadderService(valkeyManager.context);
  //   const externalServices = {
  //     identityProviderService,
  //     profileService,
  //     savedCharactersService,
  //     rankedLadderService,
  //     idGenerator,
  //   };
  //   return externalServices;
}

const TEST_USER_ID: IdentityProviderId = 1 as IdentityProviderId;
