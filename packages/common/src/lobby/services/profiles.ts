import { EntityId, IdentityProviderId } from "../../aliases.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { ERROR_MESSAGES } from "../../errors/index.js";

export interface SpeedDungeonProfile {
  id: number;
  ownerId: IdentityProviderId;
  characterCapacity: number;
  createdAt: number | Date;
  updatedAt: number | Date;
}

export class SanitizedProfile {
  createdAt: number;
  characterCapacity: number;
  constructor(profile: SpeedDungeonProfile) {
    this.createdAt = Number(profile.createdAt);
    this.characterCapacity = profile.characterCapacity;
  }
}

export type ProfileCharacterRanks = Record<
  EntityId,
  { name: string; level: number; rank: number | null; class: CombatantClass }
>;

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
