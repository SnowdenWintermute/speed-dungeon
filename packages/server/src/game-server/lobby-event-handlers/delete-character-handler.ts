import { ERROR_MESSAGES, ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";
import { removeFromArray } from "@speed-dungeon/common";
import errorHandler from "../error-handler";

const ATTEMPT_TEXT = "A client tried to delete a character but";

export default function deleteCharacterHandler(
  this: GameServer,
  socketId: string,
  characterId: string
) {
  console.log("delete character ", characterId);
  const [socket, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);
  if (!socketMeta.currentGameName)
    return errorHandler(socket, `${ATTEMPT_TEXT} they didn't know what game they were in`);
  const game = this.games.get(socketMeta.currentGameName);
  if (!game) return errorHandler(socket, `${ATTEMPT_TEXT} their game was not found`);
  const player = game.players[socketMeta.username];
  if (!player) return errorHandler(socket, `${ATTEMPT_TEXT} their player wasn't in the game`);
  if (!player.partyName) return errorHandler(socket, ERROR_MESSAGES.GAME.MISSING_PARTY_NAME);
  const party = game.adventuringParties[player.partyName];
  if (!party) return errorHandler(socket, ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

  if (!player.characterIds.includes(characterId.toString()))
    return errorHandler(socket, ERROR_MESSAGES.PLAYER.CHARACTER_NOT_OWNED);

  removeFromArray(player.characterIds, characterId);
  delete party.characters[characterId];
  removeFromArray(party.characterPositions, characterId);

  const wasReadied = game.playersReadied.includes(socketMeta.username);
  removeFromArray(game.playersReadied, socketMeta.username);
  if (wasReadied) {
    this.io
      .of(SocketNamespaces.Main)
      .in(game.name)
      .emit(ServerToClientEvent.PlayerToggledReadyToStartGame, socketMeta.username);
  }

  this.io
    .of(SocketNamespaces.Main)
    .in(game.name)
    .emit(ServerToClientEvent.CharacterDeleted, player.partyName, socketMeta.username, characterId);
}
