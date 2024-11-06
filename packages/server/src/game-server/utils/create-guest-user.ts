import { generateRandomUsername } from "../../utils/index.js";

export function createGuestUser(): { username: string; userId: null } {
  return { username: generateRandomUsername(), userId: null };
}
