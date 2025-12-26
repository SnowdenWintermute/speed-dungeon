import { IdentityProviderId, SpeedDungeonProfile } from "../../index.js";

export abstract class SpeedDungeonProfileService {
  abstract fetchExpectedProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile>;
}
