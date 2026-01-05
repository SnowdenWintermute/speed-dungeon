import { IdentityProviderId, Username } from "../../aliases.js";
import { UserId } from "../sessions/user-ids.js";

export interface IdentityResolutionContext {
  readonly cookies?: string; // user credentials or server credentials
  readonly localUserId?: IdentityProviderId;
  readonly localServerId?: string; // UUID of local server
}

export interface IdentityProviderSessionQueryStrategy {
  execute(
    context: IdentityResolutionContext
  ): Promise<{ username: Username; userId: UserId } | null>;
}

export class IdentityProviderService {
  constructor(private readonly sessionQueryStrategy: IdentityProviderSessionQueryStrategy) {}

  async resolve(context: IdentityResolutionContext) {
    return await this.sessionQueryStrategy.execute(context);
  }
}
