import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  CharacterAssociatedData,
} from "@speed-dungeon/common";
import { SocketEventNextFunction } from "./index.js";
import { Socket } from "socket.io";

export async function allowSummonedPets<
  T extends { characterId: string; allowSummonedPets?: boolean },
>(
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  eventData: T,
  _middlewareProvidedData: CharacterAssociatedData | undefined,
  next: SocketEventNextFunction<T, undefined>
) {
  eventData.allowSummonedPets = true;
  next(eventData, undefined);
}
