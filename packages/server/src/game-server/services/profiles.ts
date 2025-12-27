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
  createProfileIfUserHasNone(userId: IdentityProviderId): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async fetchExpectedProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile> {
    const expectedProfile = await this.profilesRepo.findOne("ownerId", userId);
    if (expectedProfile === undefined) {
      throw new Error(ERROR_MESSAGES.USER.MISSING_PROFILE);
    }

    return expectedProfile;
  }
}
