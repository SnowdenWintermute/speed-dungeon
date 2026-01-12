import { TaggedUserId, UserIdType } from "@speed-dungeon/common";
import { generateRandomUsername } from "../../utils/index.js";

export function createGuestUser(id: string) {
  return {
    username: generateRandomUsername(),
    taggedUserId: { type: UserIdType.Guest, id } as TaggedUserId,
  };
}
