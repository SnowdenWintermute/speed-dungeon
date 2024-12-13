import { ServerToClientEvent } from "@speed-dungeon/common";
import { LoggedInUser } from "../event-middleware/get-logged-in-user-from-socket.js";
import { fetchSavedCharacters } from "./fetch-saved-characters.js";
import { Socket } from "socket.io";

export async function fetchSavedCharactersHandler(
  _eventData: undefined,
  loggedInUser: LoggedInUser,
  socket: Socket
) {
  console.log("fetching saved characters for user", loggedInUser.session.username);
  const charactersResult = await fetchSavedCharacters(loggedInUser.profile.id);
  if (charactersResult instanceof Error) return charactersResult;
  socket.emit(ServerToClientEvent.SavedCharacterList, charactersResult);
}
