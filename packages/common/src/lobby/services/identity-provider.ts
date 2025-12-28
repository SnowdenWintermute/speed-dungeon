import { IdentityProviderId, Username } from "../../aliases.js";

export interface IdentityResolutionContext {
  readonly cookies?: string;
  readonly localUserId?: IdentityProviderId;
}

export interface IdentityProviderSessionQueryStrategy {
  execute(
    context: IdentityResolutionContext
  ): Promise<{ username: Username; userId: IdentityProviderId | null }>;
}

export class IdentityProviderService {
  constructor(private readonly sessionQueryStrategy: IdentityProviderSessionQueryStrategy) {}

  async resolve(context: IdentityResolutionContext) {
    return await this.sessionQueryStrategy.execute(context);
  }
}
