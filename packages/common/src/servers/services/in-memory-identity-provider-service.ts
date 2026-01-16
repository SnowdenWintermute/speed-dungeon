import { IdentityProviderId, Username } from "../../aliases.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { TaggedUserId } from "../sessions/user-ids.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderUserSessionQueryStrategy,
} from "./identity-provider.js";

export class InMemoryIdentityProviderQueryStrategy
  implements IdentityProviderUserSessionQueryStrategy
{
  private fakeSessions: Record<IdentityProviderId, Username> = {};
  private idGenerator = new IdGenerator({ saveHistory: false });
  constructor(fakeSessionCount: number) {
    for (let i = 0; i < fakeSessionCount; i += 1) {
      const userId = i + 1;
      this.fakeSessions[userId as IdentityProviderId] = `username-${userId}` as Username;
    }
  }

  async execute(
    context: ConnectionIdentityResolutionContext
  ): Promise<{ username: Username; taggedUserId: TaggedUserId } | null> {
    return null;
  }
}
