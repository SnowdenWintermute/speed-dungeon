import { Socket } from "socket.io";
import { getGameServer } from "../../singletons/index.js";
import {
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEventTypes,
  SpeedDungeonProfile,
  UserIdType,
} from "@speed-dungeon/common";
import { speedDungeonProfilesRepo } from "../../database/repos/speed-dungeon-profiles.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import { SocketEventNextFunction } from "./index.js";

export interface LoggedInUser {
  session: BrowserTabSession;
  userId: number;
  profile: SpeedDungeonProfile;
}

export async function provideLoggedInUser<T>(
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  eventData: T,
  _middlewareProvidedData: LoggedInUser | undefined,
  next: SocketEventNextFunction<T, LoggedInUser>
) {
  const loggedInUserResult = await getLoggedInUserFromSocket(socket);
  if (loggedInUserResult instanceof Error) return loggedInUserResult;
  next(eventData, loggedInUserResult);
}

export async function getLoggedInUserFromSocket(socket: Socket) {
  const gameServer = getGameServer();
  const browserTabSessionOption = gameServer.connections.get(socket.id);
  if (browserTabSessionOption === undefined) {
    return new Error(ERROR_MESSAGES.SERVER.BROWSER_SESSION_NOT_FOUND);
  }

  const userId = browserTabSessionOption.userId;
  if (userId.type === UserIdType.Guest) {
    return new Error(ERROR_MESSAGES.AUTH.REQUIRED);
  }

  const profileOption = await speedDungeonProfilesRepo.findOne("ownerId", userId.id);
  if (profileOption === undefined) {
    return new Error(ERROR_MESSAGES.USER.MISSING_PROFILE);
  }

  return { session: browserTabSessionOption, userId: userId.id, profile: profileOption };
}
