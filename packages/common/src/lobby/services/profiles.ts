import { IdentityProviderId, SpeedDungeonProfile } from "../../index.js";

export abstract class SpeedDungeonProfileService {
  abstract fetchExpectedProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile>;
  abstract fetchProfileOption(userId: IdentityProviderId): Promise<undefined | SpeedDungeonProfile>;
  abstract createProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile>;

  async createProfileIfUserHasNone(userId: IdentityProviderId) {
    const profileOption = this.fetchProfileOption(userId);
    //   // if they don't yet have a profile, create one
    if (profileOption === undefined) {
      console.info("creating speed dungeon profile for user on their first connection");
      await this.createProfile(userId);
    }
  }
}
