import { ERROR_MESSAGES } from "../errors/index.js";
import { ConnectionId } from "../primatives/index.js";
import { SpeedDungeonProfileLoader } from "./speed-dungeon-profile-loader.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { AuthorizedSession } from "./user-session.js";

export class SessionAuthorizationManager {
  constructor(
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly profileLoader: SpeedDungeonProfileLoader
  ) {}

  async getAuthorizedSessionOption(connectionId: ConnectionId): Promise<AuthorizedSession | null> {
    const session = this.userSessionRegistry.getExpectedSession(connectionId);
    if (session.userId === null) {
      return null;
    }

    const profile = await this.profileLoader.fetchExpectedProfile(session.userId);

    return { session, userId: session.userId, profile };
  }

  async requireAuthorizedSession(connectionId: ConnectionId) {
    const session = await this.getAuthorizedSessionOption(connectionId);

    if (session === null) {
      throw new Error(ERROR_MESSAGES.AUTH.REQUIRED);
    }

    return session;
  }
}
