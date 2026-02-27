import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import { IdentityProviderId, TaggedUserId, Username } from "@speed-dungeon/common";
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

// @TODO - old version, remove once done transitioning
export async function getAuthSessionFromCookies(
  cookies: string
): Promise<{ username: Username; userId: IdentityProviderId } | null> {
  cookies += `; internal=${env.INTERNAL_SERVICES_SECRET};`;

  const res = await fetch(`${env.AUTH_SERVER_URL}/internal/sessions`, {
    method: "GET",
    headers: {
      Cookie: cookies,
    },
  });

  const body = await res.json();
  const userIdOption: number = body["userId"];
  const usernameOption: string = body["username"];

  if (typeof usernameOption !== "string" || typeof userIdOption !== "number") return null;

  return { username: usernameOption as Username, userId: userIdOption as IdentityProviderId };
}

export async function getLoggedInUserOption(
  authSessionId: undefined | string
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

    // if they don't yet have a profile, create one
    const speedDungeonProfileOption = await speedDungeonProfilesRepo.findOne("ownerId", userId);
    if (speedDungeonProfileOption === undefined) {
      console.info("creating speed dungeon profile for user");
      await speedDungeonProfilesRepo.insert(userId);
    } else {
      console.info("user has an existing profile");
    }

    return { username, taggedUserId: { type: UserIdType.Auth, id: userId } };
  } catch (error) {
    console.info("Auth server error", error);
    return null;
  }
}
