import SocketIO from "socket.io";
import {
  ClientToServerEvent,
  ClientToServerEventTypes,
  Combatant,
  ERROR_MESSAGES,
  MAX_CHARACTER_NAME_LENGTH,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { playerCharactersRepo } from "../../database/repos/player-characters.js";
import { speedDungeonProfilesRepo } from "../../database/repos/speed-dungeon-profiles.js";
import errorHandler from "../error-handler.js";
import { characterSlotsRepo } from "../../database/repos/character-slots.js";
import { createCharacter } from "../character-creation/index.js";

export async function fetchSavedCharacters(gameServer: GameServer, socketId: string) {
  const browserTabSessionOption = gameServer.connections.get(socketId);
  if (browserTabSessionOption === undefined)
    return new Error(ERROR_MESSAGES.SERVER.BROWSER_SESSION_NOT_FOUND);
  const userIdOption = browserTabSessionOption.userId;
  if (userIdOption === null) return new Error(ERROR_MESSAGES.AUTH.REQUIRED);
  const profileOption = await speedDungeonProfilesRepo.findOne("ownerId", userIdOption);
  if (profileOption === undefined) return new Error(ERROR_MESSAGES.USER.MISSING_PROFILE);
  const slots = await characterSlotsRepo.find("profileId", profileOption.id);
  if (slots === undefined) return new Error("No character slots found");
  const toReturn: { [slot: number]: { combatant: Combatant; deepestFloorReached: number } } = {};
  const characterPromises: Promise<void>[] = [];
  for (const slot of slots) {
    if (slot.characterId === null) continue;
    characterPromises.push(
      (async () => {
        const character = await playerCharactersRepo.findOne("id", slot.characterId);
        if (character === undefined)
          return console.error("Character slot was holding an id that didn't match any character");

        toReturn[slot.slotNumber] = {
          combatant: new Combatant(
            { id: character.id, name: character.name },
            character.combatantProperties
          ),
          deepestFloorReached: character.deepestFloorReached,
        };
      })()
    );
  }
  await Promise.all(characterPromises);

  return toReturn;
}

export default function initiateSavedCharacterListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.GetSavedCharactersList, async () => {
    const charactersResult = await fetchSavedCharacters(this, socket.id);
    if (charactersResult instanceof Error)
      return socket.emit(ServerToClientEvent.ErrorMessage, charactersResult.message);
    socket.emit(ServerToClientEvent.SavedCharacterList, charactersResult);
  });

  socket.on(ClientToServerEvent.GetSavedCharacterById, async (entityId) => {});

  socket.on(ClientToServerEvent.CreateSavedCharacter, async (name, combatantClass, slotNumber) => {
    if (name.length > MAX_CHARACTER_NAME_LENGTH)
      return errorHandler(socket, ERROR_MESSAGES.COMBATANT.MAX_NAME_LENGTH_EXCEEDED);

    const browserTabSessionOption = this.connections.get(socket.id);
    if (browserTabSessionOption === undefined)
      return errorHandler(socket, ERROR_MESSAGES.SERVER.BROWSER_SESSION_NOT_FOUND);
    const userIdOption = browserTabSessionOption.userId;
    if (userIdOption === null) return errorHandler(socket, ERROR_MESSAGES.AUTH.REQUIRED);

    const profileOption = await speedDungeonProfilesRepo.findOne("ownerId", userIdOption);
    if (profileOption === undefined)
      return errorHandler(socket, ERROR_MESSAGES.USER.MISSING_PROFILE);

    const slot = await characterSlotsRepo.getSlot(profileOption.id, slotNumber);
    if (!slot) return errorHandler(socket, "Character slot missing");

    if (slot.characterId !== null)
      return errorHandler(socket, ERROR_MESSAGES.USER.CHARACTER_SLOT_FULL);

    const newCharacter = createCharacter(name, combatantClass);
    await playerCharactersRepo.insert(newCharacter, userIdOption);
    slot.characterId = newCharacter.entityProperties.id;
    await characterSlotsRepo.update(slot);

    socket.emit(
      ServerToClientEvent.SavedCharacter,
      { combatant: newCharacter, deepestFloorReached: 1 },
      slotNumber
    );
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
