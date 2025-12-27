import { Username } from "@speed-dungeon/common";
import { generateRandomUsername } from "../../utils/index.js";

export function createGuestUser(): { username: Username; userId: null } {
  return { username: generateRandomUsername(), userId: null };
}
