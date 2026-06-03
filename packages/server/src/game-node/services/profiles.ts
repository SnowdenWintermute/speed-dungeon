import {
  ERROR_MESSAGES,
  IdentityProviderId,
  SpeedDungeonProfile,
  SpeedDungeonProfileService,
} from "@speed-dungeon/common";
import { SpeedDungeonProfileRepo } from "../../database/repos/speed-dungeon-profiles.js";

export class DatabaseProfileService extends SpeedDungeonProfileService {
  constructor(private profilesRepo: SpeedDungeonProfileRepo) {
    super();
  }
  async fetchProfileOption(userId: IdentityProviderId): Promise<undefined | SpeedDungeonProfile> {
    const speedDungeonProfileOption = await this.profilesRepo.findOne("ownerId", userId);
    return speedDungeonProfileOption;
  }

  async update(userId: IdentityProviderId, profile: SpeedDungeonProfile): Promise<void> {
    const updated = await this.profilesRepo.update(profile);
    if (updated === undefined) {
      throw new Error(`${ERROR_MESSAGES.DATABASE.SAVING}`);
    }
  }

  async createProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile> {
    console.info("creating speed dungeon profile for user");
    const expectedProfile = await this.profilesRepo.insert(userId);
    if (expectedProfile === undefined) {
      throw new Error(`${ERROR_MESSAGES.DATABASE.SAVING}`);
    }
    return expectedProfile;
  }
}
