import { GameServer } from "..";
import {
  CombatantClass,
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  addCharacterToParty,
} from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import { createCharacter } from "../character-creation/index.js";

const ATTEMPT_TEXT = "A client tried to create a character but";

export default function createCharacterHandler(
  this: GameServer,
  socketId: string,
  characterName: string,
  combatantClass: CombatantClass
) {
  const [socket, socketMeta] = this.getConnection(socketId);
  const { currentGameName } = socketMeta;

  try {
    if (!currentGameName) return errorHandler(socket, `${ATTEMPT_TEXT} they have a game`);
    const game = this.games.get(currentGameName);
    if (!game) return errorHandler(socket, `${ATTEMPT_TEXT} their game was not found`);
    const player = game.players[socketMeta.username];
    if (!player) return errorHandler(socket, `${ATTEMPT_TEXT} their player wasn't in the game`);
    if (!player.partyName) return errorHandler(socket, ERROR_MESSAGES.GAME.MISSING_PARTY_NAME);

    const newCharacter = createCharacter(characterName, combatantClass);
    addCharacterToParty(game, player, newCharacter);

    const newCharacterId = newCharacter.entityProperties.id;

    const characterResult = SpeedDungeonGame.getCharacter(game, player.partyName, newCharacterId);
    if (characterResult instanceof Error) throw characterResult;

    this.io
      .of("/")
      .in(game.name)
      .emit(
        ServerToClientEvent.CharacterAddedToParty,
        player.partyName,
        socketMeta.username,
        characterResult
      );
  } catch (e) {
    if (e instanceof Error) return errorHandler(socket, e.message);
    else console.error(e);
  }
}
