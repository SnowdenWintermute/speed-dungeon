import {
  CombatantClass,
  ERROR_MESSAGES,
  MAX_CHARACTER_NAME_LENGTH,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import { Socket } from "socket.io";
import { LoggedInUser } from "../event-middleware/get-logged-in-user.js";
import { characterSlotsRepo } from "../../database/repos/character-slots.js";
import { createCharacter } from "../character-creation/index.js";
import { playerCharactersRepo } from "../../database/repos/player-characters.js";

export default async function createSavedCharacterHandler(
  eventData: { name: string; combatantClass: CombatantClass; slotNumber: number },
  loggedInUser: LoggedInUser,
  socket: Socket
) {
  const { userId, profile } = loggedInUser;

  const { name, combatantClass, slotNumber } = eventData;
  if (name.length > MAX_CHARACTER_NAME_LENGTH)
    return new Error(ERROR_MESSAGES.COMBATANT.MAX_NAME_LENGTH_EXCEEDED);

  const slot = await characterSlotsRepo.getSlot(profile.id, slotNumber);
  if (!slot) return new Error("Character slot missing");

  if (slot.characterId !== null) return new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_FULL);

  const newCharacter = createCharacter(name, combatantClass);
  await playerCharactersRepo.insert(newCharacter, userId);
  slot.characterId = newCharacter.entityProperties.id;
  await characterSlotsRepo.update(slot);

  socket.emit(
    ServerToClientEvent.SavedCharacter,
    { combatant: newCharacter, deepestFloorReached: 1 },
    slotNumber
  );
}