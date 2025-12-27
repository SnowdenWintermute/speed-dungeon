import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonProfileService } from "../services/profiles.js";
import { AuthorizedSession, UserSession } from "./user-session.js";

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
