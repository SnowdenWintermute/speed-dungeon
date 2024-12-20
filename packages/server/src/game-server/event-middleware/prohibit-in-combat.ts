import {
  ERROR_MESSAGES,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  CharacterAssociatedData,
} from "@speed-dungeon/common";
import { SocketEventNextFunction } from "./index.js";
import { Socket } from "socket.io";

export async function prohibitInCombat<T extends { characterId: string }>(
  _socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  eventData: T,
  middlewareProvidedData: CharacterAssociatedData | undefined,
  next: SocketEventNextFunction<T, CharacterAssociatedData>
) {
  if (!middlewareProvidedData) throw new Error(ERROR_MESSAGES.EVENT_MIDDLEWARE.MISSING_DATA);

  if (Object.keys(middlewareProvidedData.party.currentRoom.monsters).length)
    throw new Error(`${ERROR_MESSAGES.COMBAT_ACTIONS.NOT_USABLE_IN_COMBAT}`);

  next(eventData, middlewareProvidedData);
}
