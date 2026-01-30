import { GuestSessionReconnectionToken, IdentityProviderId, Username } from "../../aliases.js";
import { TaggedUserId } from "../sessions/user-ids.js";

export interface ConnectionIdentityResolutionContext {
  readonly authSessionId?: string;
  readonly localUserId?: IdentityProviderId;
  readonly clientCachedGuestReconnectionToken?: GuestSessionReconnectionToken;
  readonly encodedGameServerSessionClaimToken?: string;
}

export interface IdentityProviderUserSessionQueryStrategy {
  execute(
    context: ConnectionIdentityResolutionContext
  ): Promise<{ username: Username; taggedUserId: TaggedUserId } | null>;
}

/** Resolves identities based on the provided method. Hides how identities are resolved from
 *  clients such as the LobbyServer. */
export class IdentityProviderService {
  constructor(private readonly sessionQueryStrategy: IdentityProviderUserSessionQueryStrategy) {}

  async resolve(context: ConnectionIdentityResolutionContext) {
    return await this.sessionQueryStrategy.execute(context);
  }
}
