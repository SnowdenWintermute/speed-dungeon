import { CombatantClass } from "@speed-dungeon/common/src/combatants";
import { GameServer } from "..";
import { ERROR_MESSAGES, ServerToClientEvent, SocketNamespaces } from "@speed-dungeon/common";
import { generateRandomCharacterName } from "../../utils";

const ATTEMPT_TEXT = "A client tried to create a character but";

export default function createCharacterHandler(
  this: GameServer,
  socketId: string,
  characterName: string,
  combatantClass: CombatantClass
) {
  const [_, socketMeta] = this.getConnection(socketId, SocketNamespaces.Main);

  if (!socketMeta.currentGameName)
    throw new Error(`${ATTEMPT_TEXT} they didn't know what game they were in`);

  const game = this.games.get(socketMeta.currentGameName);
  if (!game) throw new Error(`${ATTEMPT_TEXT} their game was not found`);
  const player = game.players[socketMeta.username];
  if (!player) throw new Error(`${ATTEMPT_TEXT} their player wasn't in the game`);
  if (!player.partyName) throw new Error(ERROR_MESSAGES.GAME.MISSING_PARTY_NAME);

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
