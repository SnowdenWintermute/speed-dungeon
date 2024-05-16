import { CombatantClass } from "@speed-dungeon/common/src/combatants";
import { GameServer } from "..";
import { ERROR_MESSAGES, ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { generateRandomCharacterName } from "../../utils";
import errorHandler from "../error-handler";

const ATTEMPT_TEXT = "A client tried to create a character but";

export default function createCharacterHandler(
  this: GameServer,
  socketId: string,
  characterName: string,
  combatantClass: CombatantClass
) {
  const [socket, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);

  if (!socketMeta.currentGameName)
    return errorHandler(socket, `${ATTEMPT_TEXT} they didn't know what game they were in`);

  const game = this.games.get(socketMeta.currentGameName);
  if (!game) return errorHandler(socket, `${ATTEMPT_TEXT} their game was not found`);
  const player = game.players[socketMeta.username];
  if (!player) return errorHandler(socket, `${ATTEMPT_TEXT} their player wasn't in the game`);
  if (!player.partyName) return errorHandler(socket, ERROR_MESSAGES.GAME.MISSING_PARTY_NAME);

  if (characterName === "") characterName = generateRandomCharacterName();

  const newCharacterId = game.addCharacterToParty(
    player.partyName,
    combatantClass,
    characterName,
    player.username
  );

  player.characterIds[newCharacterId] = null;

  const character = game.getCharacter(player.partyName, newCharacterId);

  this.io
    .of(SocketNamespaces.Main)
    .in(game.name)
    .emit(ServerToClientEvent.CharacterCreated, player.partyName, socketMeta.username, character);
}
