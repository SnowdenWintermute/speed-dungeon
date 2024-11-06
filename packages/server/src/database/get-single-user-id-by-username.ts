import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { getUserIdsByUsername } from "./get-user-ids-by-username.js";

export default async function getSingleUserIdByUsername(username: string): Promise<Error | number> {
  const userIdsResult = await getUserIdsByUsername([username]);
  if (userIdsResult instanceof Error) return userIdsResult;
  const userId = userIdsResult[username];
  if (typeof userId !== "number") return new Error(ERROR_MESSAGES.SERVER_GENERIC);
  return userId;
}
