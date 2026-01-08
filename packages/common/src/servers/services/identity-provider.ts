import { IdentityProviderId, Username } from "../../aliases.js";
import { ConnectionRole } from "../../http-headers.js";
import { UserId } from "../sessions/user-ids.js";

export interface UserIdentityResolutionContext {
  readonly type: ConnectionRole.User;
  readonly cookies?: string; // user credentials or server credentials
  readonly localUserId?: IdentityProviderId;
}

export type ConnectionIdentityResolutionContext = UserIdentityResolutionContext;

export interface IdentityProviderUserSessionQueryStrategy {
  execute(
    context: UserIdentityResolutionContext
  ): Promise<{ username: Username; userId: UserId } | null>;
}

export class IdentityProviderService {
  constructor(private readonly sessionQueryStrategy: IdentityProviderUserSessionQueryStrategy) {}

  async resolve(context: UserIdentityResolutionContext) {
    return await this.sessionQueryStrategy.execute(context);
  }
}
