import {
  ERROR_MESSAGES,
  IdentityProviderId,
  SpeedDungeonProfile,
  SpeedDungeonProfileService,
} from "@speed-dungeon/common";
import { SpeedDungeonProfileRepo } from "../../database/repos/speed-dungeon-profiles";

export class DatabaseProfileService implements SpeedDungeonProfileService {
  constructor(private profilesRepo: SpeedDungeonProfileRepo) {}
  fetchProfileOption(userId: IdentityProviderId): Promise<undefined | SpeedDungeonProfile> {
    throw new Error("Method not implemented.");
  }
  createProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile> {
    throw new Error("Method not implemented.");
  }

  async createProfileIfUserHasNone(userId: IdentityProviderId): Promise<void> {
    // if they don't yet have a profile, create one
    const speedDungeonProfileOption = await this.profilesRepo.findOne("ownerId", userId);
    if (speedDungeonProfileOption === undefined) {
      console.info("creating speed dungeon profile for user");
      const expectedProfile = await this.profilesRepo.insert(userId);
      if (expectedProfile === undefined) {
        throw new Error(`${ERROR_MESSAGES.DATABASE.SAVING}`);
      }
    }
  }

  async fetchExpectedProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile> {
    const expectedProfile = await this.profilesRepo.findOne("ownerId", userId);
    if (expectedProfile === undefined) {
      throw new Error(ERROR_MESSAGES.USER.MISSING_PROFILE);
    }

    return expectedProfile;
  }
}
