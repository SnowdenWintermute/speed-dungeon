import { IdentityProviderId, Username } from "../../aliases.js";
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
  constructor() {
    const fakeSessionCount = 3;
    for (let i = 0; i < fakeSessionCount; i += 1) {
      const userId = i + 1;
      this.fakeSessions[userId as IdentityProviderId] = `username-${userId}` as Username;
      console.log("created fake user:", userId);
    }
  }

  async execute(
    context: IdentityResolutionContext
  ): Promise<{ username: Username; userId: IdentityProviderId | null }> {
    if (context.localUserId === undefined) {
      return { username: `guest-${context.localUserId}` as Username, userId: null };
    }

    const authenticatedSession = this.fakeSessions[context.localUserId];
    if (authenticatedSession === undefined) {
      return { username: `guest-${context.localUserId}` as Username, userId: null };
    }

    return { userId: context.localUserId, username: authenticatedSession };
  }
}
