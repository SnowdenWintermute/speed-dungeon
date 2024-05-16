import { ERROR_MESSAGES, ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { GameServer } from "..";
import { removeFromArray } from "@speed-dungeon/common";

const ATTEMPT_TEXT = "A client tried to delete a character but";

export default function deleteCharacterHandler(
  this: GameServer,
  socketId: string,
  characterId: string
) {
  console.log("delete character ", characterId);
  const [_, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);
  if (!socketMeta.currentGameName)
    throw new Error(`${ATTEMPT_TEXT} they didn't know what game they were in`);
  const game = this.games.get(socketMeta.currentGameName);
  if (!game) throw new Error(`${ATTEMPT_TEXT} their game was not found`);
  const player = game.players[socketMeta.username];
  if (!player) throw new Error(`${ATTEMPT_TEXT} their player wasn't in the game`);
  if (!player.partyName) throw new Error(ERROR_MESSAGES.GAME.MISSING_PARTY_NAME);
  const party = game.adventuringParties[player.partyName];
  if (!party) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

  if (!Object.keys(player.characterIds).includes(characterId.toString()))
    throw new Error(ERROR_MESSAGES.GAME.CHARACTER_NOT_OWNED);

  delete player.characterIds[characterId];
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
