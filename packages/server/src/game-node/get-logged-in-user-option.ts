import {
  IdentityProviderId,
  SpeedDungeonProfileService,
  TaggedUserId,
  Username,
} from "@speed-dungeon/common";
import { UserIdType } from "@speed-dungeon/common";
import { env } from "../validate-env.js";

async function getAuthSession(
  authSessionId: string
): Promise<{ username: Username; userId: IdentityProviderId } | null> {
  const cookies = `id=${authSessionId}; internal=${env.INTERNAL_SERVICES_SECRET};`;

  const res = await fetch(`${env.AUTH_SERVER_URL}/internal/sessions`, {
    method: "GET",
    headers: {
      Cookie: cookies,
    },
  });

  const body = await res.json();
  const userIdOption: number = body["userId"];
  const usernameOption: string = body["username"];

  if (typeof usernameOption !== "string" || typeof userIdOption !== "number") {
    return null;
  }

  return { username: usernameOption as Username, userId: userIdOption as IdentityProviderId };
}

export async function getLoggedInUserOption(
  authSessionId: undefined | string,
  profileService: SpeedDungeonProfileService
): Promise<{ username: Username; taggedUserId: TaggedUserId } | null> {
  if (!authSessionId) {
    return null;
  }

  try {
    const authenticatedUserOption = await getAuthSession(authSessionId);
    if (authenticatedUserOption === null) {
      return null;
    }

    const { username, userId } = authenticatedUserOption;

    await profileService.createProfileIfUserHasNone(userId);

    return { username, taggedUserId: { type: UserIdType.Auth, id: userId } };
  } catch (error) {
    console.info("Auth server error", error);
    return null;
  }
}
