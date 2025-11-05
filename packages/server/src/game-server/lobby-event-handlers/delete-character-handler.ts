import { ArrayUtils, ERROR_MESSAGES, ServerToClientEvent } from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware";
import { Socket } from "socket.io";
import { getGameServer } from "../../singletons/index.js";

export function deleteCharacterHandler(
  characterId: string,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const { game, partyOption, player, session } = playerAssociatedData;

  const partyDoesNotExist = partyOption === undefined;
  if (partyDoesNotExist) {
    return errorHandler(socket, new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST));
  }

  const party = partyOption;

  if (!player.characterIds.includes(characterId.toString())) {
    return errorHandler(socket, new Error(ERROR_MESSAGES.PLAYER.CHARACTER_NOT_OWNED));
  }

  party.removeCharacter(characterId, player);

  party.combatantManager.updateHomePositions();

  const wasReadied = game.playersReadied.includes(session.username);
  ArrayUtils.removeElement(game.playersReadied, session.username);
  const gameServer = getGameServer();

  if (wasReadied) {
    gameServer.io
      .of("/")
      .in(game.name)
      .emit(ServerToClientEvent.PlayerToggledReadyToStartGame, session.username);
  }

  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.CharacterDeleted, session.username, characterId);
}
