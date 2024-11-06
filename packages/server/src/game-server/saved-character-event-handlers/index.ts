import SocketIO from "socket.io";
import {
  ClientToServerEvent,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { applyMiddlewares } from "../event-middleware/index.js";
import { provideLoggedInUser } from "../event-middleware/get-logged-in-user-from-socket.js";
import createSavedCharacterHandler from "./create-saved-character-handler.js";
import { fetchSavedCharactersHandler } from "./fetch-saved-characters-handler.js";
import deleteSavedCharacterHandler from "./delete-saved-character-handler.js";

export default function initiateSavedCharacterListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(
    ClientToServerEvent.GetSavedCharactersList,
    applyMiddlewares(provideLoggedInUser)(socket, fetchSavedCharactersHandler)
  );

  socket.on(ClientToServerEvent.GetSavedCharacterById, async (entityId) => {});

  socket.on(
    ClientToServerEvent.CreateSavedCharacter,
    applyMiddlewares(provideLoggedInUser)(socket, createSavedCharacterHandler)
  );

  socket.on(
    ClientToServerEvent.DeleteSavedCharacter,
    applyMiddlewares(provideLoggedInUser)(socket, deleteSavedCharacterHandler)
  );
}
