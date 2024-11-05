import { Socket } from "socket.io";
import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import { ServerToClientEvent } from "@speed-dungeon/common";
import getAuthSession from "./utils/get-auth-session.js";

export async function getLoggedInUser(
  cookies: undefined | string,
  socket: Socket
): Promise<[null | string, null | number]> {
  const nullUser: [null, null] = [null, null];
  if (!cookies) return nullUser;

  try {
    const authenticatedUserOption = await getAuthSession(cookies);
    if (authenticatedUserOption === null) return nullUser;

    const { username, userId } = authenticatedUserOption;

    // this is a logged in user
    const speedDungeonProfileOption = await speedDungeonProfilesRepo.findOne("ownerId", userId);
    if (speedDungeonProfileOption === undefined) {
      console.info("creating speed dungeon profile for user");
      await speedDungeonProfilesRepo.insert(userId);
    } else console.info("user has an existing profile");

    return [username, userId];
  } catch (error) {
    socket.emit(ServerToClientEvent.ErrorMessage, "Auth server error");
  }

  return nullUser;
}
