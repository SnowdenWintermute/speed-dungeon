import { Socket } from "socket.io";
import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import { ServerToClientEvent } from "@speed-dungeon/common";
import getAuthSession from "./utils/get-auth-session.js";
import { createGuestUser } from "./utils/create-guest-user.js";

export async function getLoggedInUserOrCreateGuest(
  cookies: undefined | string,
  socket: Socket
): Promise<{ username: string; userId: null | number }> {
  if (!cookies) return createGuestUser();

  try {
    const authenticatedUserOption = await getAuthSession(cookies);
    if (authenticatedUserOption === null) return createGuestUser();

    const { username, userId } = authenticatedUserOption;

    // if they don't yet have a profile, create one
    const speedDungeonProfileOption = await speedDungeonProfilesRepo.findOne("ownerId", userId);
    if (speedDungeonProfileOption === undefined) {
      console.info("creating speed dungeon profile for user");
      await speedDungeonProfilesRepo.insert(userId);
    } else console.info("user has an existing profile");

    return { username, userId };
  } catch (error) {
    socket.emit(ServerToClientEvent.ErrorMessage, "Auth server error");
  }

  return createGuestUser();
}
