import { IdentityProviderId, Username } from "@speed-dungeon/common";
import { env } from "../../validate-env.js";

export default async function getAuthSession(
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
