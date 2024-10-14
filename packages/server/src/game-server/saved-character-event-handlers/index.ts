import SocketIO from "socket.io";
import {
  ClientToServerEvent,
  ClientToServerEventTypes,
  Combatant,
  ERROR_MESSAGES,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { playerCharactersRepo } from "../../database/repos/player-characters.js";
import { speedDungeonProfilesRepo } from "../../database/repos/speed-dungeon-profiles.js";
import errorHandler from "../error-handler.js";
import { createCharacter } from "../character-creation/index.js";

async function fetchSavedCharacters(gameServer: GameServer, socketId: string) {
  const browserTabSessionOption = gameServer.connections.get(socketId);
  if (browserTabSessionOption === undefined)
    return new Error(ERROR_MESSAGES.SERVER.BROWSER_SESSION_NOT_FOUND);
  const userIdOption = browserTabSessionOption.userId;
  if (userIdOption === null) return new Error(ERROR_MESSAGES.AUTH.REQUIRED);
  const characters = await playerCharactersRepo.find("ownerId", userIdOption);
  return characters;
}

export default function initiateSavedCharacterListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.GetSavedCharactersList, async () => {
    const charactersResult = await fetchSavedCharacters(this, socket.id);
    if (charactersResult instanceof Error)
      return socket.emit(ServerToClientEvent.ErrorMessage, charactersResult.message);
    if (charactersResult) {
      const combatants = charactersResult.map(
        (item) => new Combatant({ id: item.id, name: item.name }, item.combatantProperties)
      );
      socket.emit(ServerToClientEvent.SavedCharacterList, combatants);
    }
  });

  socket.on(ClientToServerEvent.GetSavedCharacterById, async (entityId) => {});

  socket.on(ClientToServerEvent.CreateSavedCharacter, async (name, combatantClass, slot) => {
    const browserTabSessionOption = this.connections.get(socket.id);
    if (browserTabSessionOption === undefined)
      return errorHandler(socket, ERROR_MESSAGES.SERVER.BROWSER_SESSION_NOT_FOUND);
    const userIdOption = browserTabSessionOption.userId;
    if (userIdOption === null) return errorHandler(socket, ERROR_MESSAGES.AUTH.REQUIRED);
    const characters = await playerCharactersRepo.find("ownerId", userIdOption);

    const profileOption = await speedDungeonProfilesRepo.findOne("ownerId", userIdOption);
    if (profileOption === undefined)
      return errorHandler(socket, ERROR_MESSAGES.USER.MISSING_PROFILE);

    const reachedCapacity = (characters?.length || 0) >= profileOption.characterCapacity;

    if (reachedCapacity) return errorHandler(socket, ERROR_MESSAGES.USER.SAVED_CHARACTER_CAPACITY);

    const newCharacter = createCharacter(name, combatantClass);
    await playerCharactersRepo.insert(newCharacter, userIdOption);

    console.log("created character in slot", slot);

    socket.emit(ServerToClientEvent.SavedCharacter, newCharacter, slot);
  });

  socket.on(ClientToServerEvent.DeleteSavedCharacter, async (entityId) => {
    if (!entityId) return errorHandler(socket, ERROR_MESSAGES.COMBATANT.NOT_FOUND);
    // check if they even own the character they're trying to delete
    const browserTabSessionOption = this.connections.get(socket.id);
    if (browserTabSessionOption === undefined)
      return errorHandler(socket, ERROR_MESSAGES.SERVER.BROWSER_SESSION_NOT_FOUND);
    const userIdOption = browserTabSessionOption.userId;
    if (userIdOption === null) return errorHandler(socket, ERROR_MESSAGES.AUTH.REQUIRED);
    const characterToDelete = await playerCharactersRepo.findOne("id", entityId);
    if (characterToDelete?.ownerId !== userIdOption)
      return errorHandler(socket, ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_OWNED);
    await playerCharactersRepo.delete(entityId);
    socket.emit(ServerToClientEvent.SavedCharacterDeleted, entityId);
  });
}
