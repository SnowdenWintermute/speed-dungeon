import {
  ERROR_MESSAGES,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  CharacterAssociatedData,
} from "@speed-dungeon/common";
import { SocketEventNextFunction } from "./index.js";
import { Socket } from "socket.io";

export async function prohibitIfDead<T extends { characterId: string }>(
  _socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  eventData: T,
  middlewareProvidedData: CharacterAssociatedData | undefined,
  next: SocketEventNextFunction<T, CharacterAssociatedData>
) {
  if (!middlewareProvidedData) throw new Error(ERROR_MESSAGES.EVENT_MIDDLEWARE.MISSING_DATA);

  if (middlewareProvidedData.character.combatantProperties.hitPoints <= 0)
    throw new Error(`${ERROR_MESSAGES.COMBATANT.IS_DEAD}`);

  next(eventData, middlewareProvidedData);
}
