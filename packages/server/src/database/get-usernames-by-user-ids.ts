import { env } from "../validate-env.js";
import { usernamesByUserIdsSchema } from "../validation/usernames-by-user-id-schema.js";

export async function getUsernamesByUserIds(userIds: number[]) {
  const cookies = `internal=${env.INTERNAL_SERVICES_SECRET};`;
  const queryString = `?ids=${userIds.join(",")}`;
  const userIdsResponse = await fetch(`${env.AUTH_SERVER_URL}/internal/usernames${queryString}`, {
    method: "GET",
    headers: {
      Cookie: cookies,
    },
  });

  const responseBody = await userIdsResponse.json();
  const validationResult = usernamesByUserIdsSchema.safeParse(responseBody);
  if (validationResult.error) return new Error(JSON.stringify(validationResult.error.format()));
  const data = validationResult.data;

  return data;
}
