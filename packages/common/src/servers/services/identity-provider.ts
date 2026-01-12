import { IdentityProviderId, Username } from "../../aliases.js";
import { ConnectionRole } from "../../http-headers.js";
import { GameServerSessionClaimToken } from "../lobby-server/game-handoff/session-claim-token.js";
import { TaggedUserId } from "../sessions/user-ids.js";

export interface ConnectionIdentityResolutionContext {
  readonly type: ConnectionRole.User;
  readonly cookies?: string; // user credentials or server credentials
  readonly localUserId?: IdentityProviderId;
  readonly gameServerSessionClaimToken?: GameServerSessionClaimToken;
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
