import { IdentityProviderId, SpeedDungeonProfile } from "..";

export abstract class SpeedDungeonProfileLoader {
  constructor() {}

  abstract fetchExpectedProfile(userId: IdentityProviderId): Promise<SpeedDungeonProfile>;
}
