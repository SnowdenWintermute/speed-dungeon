import { IdentityProviderId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonProfile, SpeedDungeonProfileService } from "../services/profiles.js";
import { UserSession } from "./user-session.js";

export interface AuthorizedSession {
  session: UserSession;
  userId: IdentityProviderId;
  profile: SpeedDungeonProfile;
}

export class SessionAuthorizationManager {
  constructor(private readonly profileService: SpeedDungeonProfileService) {}

  async getAuthorizedSessionOption(session: UserSession): Promise<AuthorizedSession | null> {
    if (session.userId === null) {
      return null;
    }

    const profile = await this.profileService.fetchExpectedProfile(session.userId);

    return { session, userId: session.userId, profile };
  }

  async requireAuthorizedSession(session: UserSession) {
    const authorizedSession = await this.getAuthorizedSessionOption(session);

    if (authorizedSession === null) {
      throw new Error(ERROR_MESSAGES.AUTH.REQUIRED);
    }

    return authorizedSession;
  }
}
