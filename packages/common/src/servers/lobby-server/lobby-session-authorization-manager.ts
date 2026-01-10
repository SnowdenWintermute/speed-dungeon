import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonProfileService } from "../services/profiles.js";
import {
  AuthorizedSession,
  SessionAuthorizationManager,
} from "../sessions/authorization-manager.js";
import { UserIdType } from "../sessions/user-ids.js";
import { UserSession } from "../sessions/user-session.js";

export class LobbySessionAuthorizationManager implements SessionAuthorizationManager {
  constructor(private readonly profileService: SpeedDungeonProfileService) {}

  async getAuthorizedSessionOption(session: UserSession): Promise<AuthorizedSession | null> {
    if (session.userId.type === UserIdType.Guest) {
      return null;
    }

    const profile = await this.profileService.fetchExpectedProfile(session.userId.id);

    return { session, userId: session.userId.id, profile };
  }

  async requireAuthorizedSession(session: UserSession) {
    const authorizedSession = await this.getAuthorizedSessionOption(session);

    if (authorizedSession === null) {
      throw new Error(ERROR_MESSAGES.AUTH.REQUIRED);
    }

    return authorizedSession;
  }
}
