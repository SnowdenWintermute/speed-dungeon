import { IdentityProviderId, Username } from "../../aliases.js";
import { invariant, SequentialIdGenerator } from "../../utils/index.js";
import { TaggedUserId, UserIdType } from "../sessions/user-ids.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderUserSessionQueryStrategy,
} from "./identity-provider.js";
import { UsernameDirectory } from "./username-directory.js";

export class InMemoryIdentityProviderQueryStrategy
  implements IdentityProviderUserSessionQueryStrategy, UsernameDirectory
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

  changeUsername(authSessionId: string, value: string) {
    const authId = this.authSessions.get(authSessionId);
    invariant(authId !== undefined, "expected an auth session");
    const identity = this.identities.get(authId);
    invariant(identity !== undefined, "expected to find an identity");
    this.identities.set(authId, value as Username);
  }

  deleteIdentity(authSessionId: string) {
    const authId = this.authSessions.get(authSessionId);
    invariant(authId !== undefined, "expected an auth session");
    this.authSessions.delete(authSessionId);
    this.identities.delete(authId);
  }

  async resolveUsernames(ids: IdentityProviderId[]): Promise<Map<IdentityProviderId, Username>> {
    const resolved = new Map<IdentityProviderId, Username>();
    for (const id of ids) {
      const usernameOption = this.identities.get(id);
      if (usernameOption !== undefined) {
        resolved.set(id, usernameOption);
      }
    }
    return resolved;
  }

  async findUserIdByUsername(username: Username): Promise<IdentityProviderId | undefined> {
    for (const [id, existingUsername] of this.identities) {
      if (existingUsername === username) {
        return id;
      }
    }
    return undefined;
  }

  async execute(
    context: ConnectionIdentityResolutionContext
  ): Promise<{ username: Username; taggedUserId: TaggedUserId } | null> {
    if (context.authSessionId !== undefined) {
      const activeSessionOptionUserId = this.authSessions.get(context.authSessionId);

      if (activeSessionOptionUserId !== undefined) {
        const username = this.identities.get(activeSessionOptionUserId);
        if (!username) {
          throw new Error("in memory auth session expected");
        }
        return { username, taggedUserId: { type: UserIdType.Auth, id: activeSessionOptionUserId } };
      }
    }
    return null;
  }
}
