import { IdentityProviderId, Username } from "@speed-dungeon/common";
import { env } from "../../validate-env.js";

export async function getAuthSession(
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
