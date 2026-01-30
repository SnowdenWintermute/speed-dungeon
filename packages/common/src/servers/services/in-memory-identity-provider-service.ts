import { IdentityProviderId, Username } from "../../aliases.js";
import { SequentialIdGenerator } from "../../utils/index.js";
import { TaggedUserId, UserIdType } from "../sessions/user-ids.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderUserSessionQueryStrategy,
} from "./identity-provider.js";

export class InMemoryIdentityProviderQueryStrategy
  implements IdentityProviderUserSessionQueryStrategy
{
  private identities = new Map<IdentityProviderId, Username>();
  private authSessions = new Map<string, IdentityProviderId>();
  private idGenerator = new SequentialIdGenerator();

  private getNextUserId() {
    return this.idGenerator.getNextIdNumeric() as IdentityProviderId;
  }

  addIdentityWithPermenantAuthSession(username: Username, authSessionId: string) {
    const id = this.getNextUserId();
    this.identities.set(id, username);
    this.authSessions.set(authSessionId, id);
  }

  async execute(
    context: ConnectionIdentityResolutionContext
  ): Promise<{ username: Username; taggedUserId: TaggedUserId } | null> {
    if (context.authSessionId !== undefined) {
      const activeSessionOptionUserId = this.authSessions.get(context.authSessionId) || null;

      if (activeSessionOptionUserId) {
        const username = this.identities.get(activeSessionOptionUserId);
        if (!username) {
          throw new Error("in memory auth session expected");
        }
        console.log("in memory auth user session found");
        return { username, taggedUserId: { type: UserIdType.Auth, id: activeSessionOptionUserId } };
      }
    }
    return null;
  }
}
