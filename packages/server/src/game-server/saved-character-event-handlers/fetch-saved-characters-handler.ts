import { ServerToClientEvent } from "@speed-dungeon/common";
import { LoggedInUser } from "../event-middleware/get-logged-in-user.js";
import { fetchSavedCharacters } from "./fetch-saved-characters.js";
import { Socket } from "socket.io";

export async function fetchSavedCharactersHandler(
  _eventData: undefined,
  loggedInUser: LoggedInUser,
  socket: Socket
) {
  const charactersResult = await fetchSavedCharacters(loggedInUser);
  if (charactersResult instanceof Error) return charactersResult;
  socket.emit(ServerToClientEvent.SavedCharacterList, charactersResult);
}
