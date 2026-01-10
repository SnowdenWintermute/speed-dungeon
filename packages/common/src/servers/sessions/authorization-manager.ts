import { IdentityProviderId } from "../../aliases.js";
import { SpeedDungeonProfile } from "../services/profiles.js";
import { UserSession } from "./user-session.js";

export interface AuthorizedSession {
  session: UserSession;
  userId: IdentityProviderId;
  profile: SpeedDungeonProfile;
}

export interface SessionAuthorizationManager {
  getAuthorizedSessionOption(session: UserSession): Promise<AuthorizedSession | null>;

  requireAuthorizedSession(session: UserSession): Promise<AuthorizedSession>;
}
