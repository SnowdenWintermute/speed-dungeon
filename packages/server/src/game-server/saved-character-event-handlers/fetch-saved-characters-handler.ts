import { Combatant, ServerToClientEvent } from "@speed-dungeon/common";
import { LoggedInUser } from "../event-middleware/get-logged-in-user-from-socket.js";
import { fetchSavedCharacters } from "./fetch-saved-characters.js";
import { Socket } from "socket.io";

export async function fetchSavedCharactersHandler(
  _eventData: undefined,
  loggedInUser: LoggedInUser,
  socket: Socket
) {
  const charactersResult = await fetchSavedCharacters(loggedInUser.profile.id);

  if (charactersResult instanceof Error) {
    return charactersResult;
  }

  const toSend: Record<number, { combatant: Combatant; pets: Combatant[] }> = {};

  for (const [slot, { combatant, pets }] of Object.entries(charactersResult)) {
    const serializedPets = pets.map((pet) => pet.getSerialized());
    toSend[parseInt(slot)] = { combatant: combatant.getSerialized(), pets: serializedPets };
  }

  console.log("sending characters:", toSend);

  socket.emit(ServerToClientEvent.SavedCharacterList, toSend);
}
