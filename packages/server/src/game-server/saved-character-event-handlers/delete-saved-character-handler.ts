import { Socket } from "socket.io";
import { LoggedInUser } from "../event-middleware/get-logged-in-user.js";
import { ERROR_MESSAGES, ServerToClientEvent } from "@speed-dungeon/common";
import { playerCharactersRepo } from "../../database/repos/player-characters.js";

export default async function deleteSavedCharacterHandler(
  entityId: string,
  loggedInUser: LoggedInUser,
  socket: Socket
) {
  if (!entityId) return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);
  // check if they even own the character they're trying to delete
  const { userId } = loggedInUser;

  const characterToDelete = await playerCharactersRepo.findOne("id", entityId);
  if (characterToDelete?.ownerId !== userId)
    return new Error(ERROR_MESSAGES.USER.SAVED_CHARACTER_NOT_OWNED);
  await playerCharactersRepo.delete(entityId);
  socket.emit(ServerToClientEvent.SavedCharacterDeleted, entityId);
}