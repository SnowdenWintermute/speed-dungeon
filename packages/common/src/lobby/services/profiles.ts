import { ERROR_MESSAGES, IdentityProviderId, SpeedDungeonProfile } from "../../index.js";

export abstract class SpeedDungeonProfileService {
  abstract fetchProfileOption(userId: IdentityProviderId): Promise<undefined | SpeedDungeonProfile>;
  abstract createProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile>;

  async fetchExpectedProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile> {
    const expectedProfile = await this.fetchProfileOption(userId);
    if (expectedProfile === undefined) {
      throw new Error(ERROR_MESSAGES.USER.MISSING_PROFILE);
    }

    return expectedProfile;
  }

  async createProfileIfUserHasNone(userId: IdentityProviderId) {
    const profileOption = await this.fetchProfileOption(userId);
    //   // if they don't yet have a profile, create one
    if (profileOption === undefined) {
      console.info("creating speed dungeon profile for user on their first connection");
      await this.createProfile(userId);
    }
  }
}
