import { EntityId, GameId, IdentityProviderId, ProfileId } from "../../aliases.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CharacterControlScheme } from "../../game-modes/index.js";

export interface SpeedDungeonProfile {
  id: ProfileId;
  ownerId: IdentityProviderId;
  characterCapacities: Record<CharacterControlScheme, number>;
  ironmanRunCapacity: number;
  ironmanRunIds: GameId[];
  createdAt: number | Date;
  updatedAt: number | Date;
}

export class SanitizedProfile {
  createdAt: number;
  characterCapacities: Record<CharacterControlScheme, number>;
  ironmanRunCapacity: number;
  ironmanRunIds: GameId[];
  constructor(profile: SpeedDungeonProfile) {
    this.createdAt = Number(profile.createdAt);
    this.characterCapacities = profile.characterCapacities;
    this.ironmanRunCapacity = profile.ironmanRunCapacity;
    this.ironmanRunIds = profile.ironmanRunIds;
  }
}

export type ProfileCharacterRanks = Record<
  EntityId,
  { name: string; level: number; rank: number | null; class: CombatantClass }
>;

export abstract class SpeedDungeonProfileService {
  abstract fetchProfileOption(userId: IdentityProviderId): Promise<undefined | SpeedDungeonProfile>;
  abstract createProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile>;
  abstract update(userId: IdentityProviderId, profile: SpeedDungeonProfile): Promise<void>;

  async fetchExpectedProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile> {
    const expectedProfile = await this.fetchProfileOption(userId);
    if (expectedProfile === undefined) {
      throw new Error(ERROR_MESSAGES.USER.MISSING_PROFILE);
    }

    return expectedProfile;
  }

  async createProfileIfUserHasNone(userId: IdentityProviderId) {
    const profileOption = await this.fetchProfileOption(userId);
    if (profileOption === undefined) {
      await this.createProfile(userId);
    }
  }
}
