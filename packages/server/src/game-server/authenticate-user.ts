import { Socket } from "socket.io";
import { env } from "../validate-env.js";
import { speedDungeonProfilesRepo } from "../database/repos/speed-dungeon-profiles.js";
import { ServerToClientEvent } from "@speed-dungeon/common";

export async function authenticateUser(
  cookies: undefined | string,
  socket: Socket
): Promise<[null | string, null | number]> {
  let username: null | string = null;
  let userId: null | number = null;

  if (!cookies) return [username, userId];

  try {
    const res = await fetch(`${env.AUTH_SERVER_URL}/internal/sessions`, {
      method: "GET",
      headers: {
        Cookie: cookies,
      },
    });
    const body = await res.json();
    username = body["username"] || null;
    const userIdOption = body["userId"];
    if (!username || typeof userIdOption !== "number") return [username, userId];

    const userIdAsNumber = userIdOption;
    userId = userIdAsNumber;
    // this is a logged in user
    const speedDungeonProfileOption = await speedDungeonProfilesRepo.findOne(
      "ownerId",
      userIdOption
    );
    if (speedDungeonProfileOption === undefined) {
      console.info("creating speed dungeon profile for user");
      await speedDungeonProfilesRepo.insert(userId);
    } else console.info("user has an existing profile");
  } catch (error) {
    socket.emit(ServerToClientEvent.ErrorMessage, "Auth server error");
  }

  return [username, userId];
}
