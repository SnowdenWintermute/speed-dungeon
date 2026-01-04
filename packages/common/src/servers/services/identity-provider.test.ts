import { IdentityProviderId, Username } from "../../aliases.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { UserId, UserIdType } from "../sessions/user-ids.js";
import {
  IdentityProviderSessionQueryStrategy,
  IdentityResolutionContext,
} from "./identity-provider.js";

describe("identity provider service", () => {
  it("", async () => {
    //
  });
});

export class FakeUsersIdentityProviderQueryStrategy
  implements IdentityProviderSessionQueryStrategy
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
    context: IdentityResolutionContext
  ): Promise<{ username: Username; userId: UserId } | null> {
    if (context.localUserId === undefined) {
      return {
        username: `guest-${context}` as Username,
        userId: { type: UserIdType.Guest, id: this.idGenerator.generate() },
      };
    }

    const authenticatedSession = this.fakeSessions[context.localUserId];
    if (authenticatedSession === undefined) {
      return {
        username: `guest-${context.localUserId}` as Username,
        userId: { type: UserIdType.Guest, id: this.idGenerator.generate() },
      };
    }

    return {
      username: authenticatedSession,
      userId: { type: UserIdType.Auth, id: context.localUserId },
    };
  }
}
