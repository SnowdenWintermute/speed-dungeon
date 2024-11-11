import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { env } from "../validate-env.js";
import { userIdsByUsernameSchema } from "../validation/user-ids-by-username-schema.js";

export async function getUserIdsByUsername(usernames: string[]) {
  try {
    const cookies = `internal=${env.INTERNAL_SERVICES_SECRET};`;
    const usernamesQueryString = `?usernames=${usernames.join(",")}`;
    const userIdsResponse = await fetch(
      `${env.AUTH_SERVER_URL}/internal/user_ids${usernamesQueryString}`,
      {
        method: "GET",
        headers: {
          Cookie: cookies,
        },
      }
    );

    const responseBody = await userIdsResponse.json();
    const validationResult = userIdsByUsernameSchema.safeParse(responseBody);
    if (validationResult.error) return new Error(JSON.stringify(validationResult.error.format()));
    const playerUserIdsByUsername = validationResult.data;

    return playerUserIdsByUsername;
  } catch (error) {
    console.error(error);
    return new Error(ERROR_MESSAGES.SERVER_GENERIC);
  }
}
