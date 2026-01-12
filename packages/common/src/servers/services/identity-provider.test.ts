import { GuestUserId, IdentityProviderId, Username } from "../../aliases.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { TaggedUserId, UserIdType } from "../sessions/user-ids.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderUserSessionQueryStrategy,
} from "./identity-provider.js";

describe("identity provider service", () => {
  it("", async () => {
    //
  });
});

export class FakeUsersIdentityProviderQueryStrategy
  implements IdentityProviderUserSessionQueryStrategy
{
  private fakeSessions: Record<IdentityProviderId, Username> = {};
  private idGenerator = new IdGenerator({ saveHistory: false });
  constructor(fakeSessionCount: number) {
    for (let i = 0; i < fakeSessionCount; i += 1) {
      const userId = i + 1;
      this.fakeSessions[userId as IdentityProviderId] = `username-${userId}` as Username;
      console.log("created fake user:", userId);
    }
  }

  async execute(
    context: ConnectionIdentityResolutionContext
  ): Promise<{ username: Username; taggedUserId: TaggedUserId } | null> {
    if (context.localUserId === undefined) {
      return {
        username: `guest-${context}` as Username,
        taggedUserId: { type: UserIdType.Guest, id: this.idGenerator.generate() as GuestUserId },
      };
    }

    const authenticatedSession = this.fakeSessions[context.localUserId];
    if (authenticatedSession === undefined) {
      return {
        username: `guest-${context.localUserId}` as Username,
        taggedUserId: { type: UserIdType.Guest, id: this.idGenerator.generate() as GuestUserId },
      };
    }

    return {
      username: authenticatedSession,
      taggedUserId: { type: UserIdType.Auth, id: context.localUserId as IdentityProviderId },
    };
  }
}
