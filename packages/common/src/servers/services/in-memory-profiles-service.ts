import { IdentityProviderId, ProfileId } from "../../aliases.js";
import { DEFAULT_ACCOUNT_CHARACTER_CAPACITY } from "../../app-consts.js";
import { SequentialIdGenerator } from "../../utils/index.js";
import { InMemorySavedCharacterSlotsPersistenceStrategy } from "./in-memory-saved-characters-service.js";
import { SpeedDungeonProfile, SpeedDungeonProfileService } from "./profiles.js";

export class InMemorySpeedDungeonProfileService extends SpeedDungeonProfileService {
  private profiles = new Map<IdentityProviderId, SpeedDungeonProfile>();
  private idGenerator = new SequentialIdGenerator();

  constructor(
    private characterSlotsPersistenceStrategy: InMemorySavedCharacterSlotsPersistenceStrategy
  ) {
    super();
  }

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

    this.characterSlotsPersistenceStrategy.insertSlotsForProfile(newProfile.id);

    return newProfile;
  }
}
