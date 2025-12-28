import { describe, it, expect } from "vitest";
import { SpeedDungeonProfile } from "../types.js";
import { SpeedDungeonProfileService } from "./services/profiles.js";
import { IdentityProviderId, ProfileId } from "../aliases.js";
import { SequentialIdGenerator } from "../utils/index.js";
import { DEFAULT_ACCOUNT_CHARACTER_CAPACITY } from "../app-consts.js";

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
  //   const profileService = new DatabaseProfileService(speedDungeonProfilesRepo);
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

export class InMemorySpeedDungeonProfileService extends SpeedDungeonProfileService {
  private profiles = new Map<IdentityProviderId, SpeedDungeonProfile>();
  private idGenerator = new SequentialIdGenerator();

  async fetchProfileOption(userId: IdentityProviderId): Promise<undefined | SpeedDungeonProfile> {
    return this.profiles.get(userId);
  }

  async createProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile> {
    const newProfile = {
      id: this.idGenerator.getNextIdNumeric() as ProfileId,
      ownerId: userId,
      characterCapacity: DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.profiles.set(userId, newProfile);
    return newProfile;
  }
}
