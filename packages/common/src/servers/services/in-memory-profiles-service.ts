import cloneDeep from "lodash.clonedeep";
import { IdentityProviderId, ProfileId } from "../../aliases.js";
import {
  DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
  DEFAULT_ACCOUNT_IRONMAN_RUN_CAPACITY,
} from "../../app-consts.js";
import { CharacterControlScheme } from "../../game-modes/index.js";
import { SequentialIdGenerator } from "../../utils/index.js";
import { SpeedDungeonProfile, SpeedDungeonProfileService } from "./profiles.js";

export class InMemorySpeedDungeonProfileService extends SpeedDungeonProfileService {
  private profiles = new Map<IdentityProviderId, SpeedDungeonProfile>();
  private idGenerator = new SequentialIdGenerator();

  // clone on read/write so a caller mutating a fetched profile doesn't silently mutate the store
  // before calling update() — emulates a real DB's serialize boundary.
  async fetchProfileOption(userId: IdentityProviderId): Promise<undefined | SpeedDungeonProfile> {
    const profileOption = this.profiles.get(userId);
    return profileOption === undefined ? undefined : cloneDeep(profileOption);
  }

  async update(userId: IdentityProviderId, updated: SpeedDungeonProfile): Promise<void> {
    this.profiles.set(userId, cloneDeep(updated));
  }

  async createProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile> {
    const newProfile = {
      id: this.idGenerator.getNextIdNumeric() as ProfileId,
      ownerId: userId,
      characterCapacities: {
        [CharacterControlScheme.Captain]: DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
        [CharacterControlScheme.Freelancer]: DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
      },
      ironmanRunCapacity: DEFAULT_ACCOUNT_IRONMAN_RUN_CAPACITY,
      ironmanRunIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.profiles.set(userId, cloneDeep(newProfile));

    return cloneDeep(newProfile);
  }
}
