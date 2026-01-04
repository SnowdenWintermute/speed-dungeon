import { UserId, UserIdType } from "@speed-dungeon/common";
import { generateRandomUsername } from "../../utils/index.js";

export function createGuestUser(id: string) {
  return { username: generateRandomUsername(), userId: { type: UserIdType.Guest, id } as UserId };
}
