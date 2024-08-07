import { GameServer } from "..";
import {
  CombatantClass,
  ERROR_MESSAGES,
  EntityId,
  PlayerCharacter,
  ServerToClientEvent,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { generateRandomCharacterName } from "../../utils";
import errorHandler from "../error-handler";
import { MAX_PARTY_SIZE } from "@speed-dungeon/common";
import outfitNewCharacter from "../item-generation/outfit-new-character";

const ATTEMPT_TEXT = "A client tried to create a character but";

export default function createCharacterHandler(
  this: GameServer,
  socketId: string,
  characterName: string,
  combatantClass: CombatantClass
) {
  const [socket, socketMeta] = this.getConnection(socketId);

  try {
    if (!socketMeta.currentGameName)
      return errorHandler(socket, `${ATTEMPT_TEXT} they didn't know what game they were in`);

    const game = this.games.get(socketMeta.currentGameName);
    if (!game) return errorHandler(socket, `${ATTEMPT_TEXT} their game was not found`);
    const player = game.players[socketMeta.username];
    if (!player) return errorHandler(socket, `${ATTEMPT_TEXT} their player wasn't in the game`);
    if (!player.partyName) return errorHandler(socket, ERROR_MESSAGES.GAME.MISSING_PARTY_NAME);

    if (characterName === "") characterName = generateRandomCharacterName();

    const newCharacterId = addCharacterToParty(
      this,
      game,
      player.partyName,
      combatantClass,
      characterName,
      player.username
    );

    player.characterIds.push(newCharacterId);

    const characterResult = SpeedDungeonGame.getCharacter(game, player.partyName, newCharacterId);
    if (characterResult instanceof Error) throw characterResult;

    this.io
      .of("/")
      .in(game.name)
      .emit(
        ServerToClientEvent.CharacterCreated,
        player.partyName,
        socketMeta.username,
        characterResult
      );
  } catch (e) {
    if (e instanceof Error) return errorHandler(socket, e.message);
    else console.error(e);
  }
}

function addCharacterToParty(
  gameServer: GameServer,
  game: SpeedDungeonGame,
  partyName: string,
  combatantClass: CombatantClass,
  characterName: string,
  nameOfControllingUser: string
): EntityId {
  const party = game.adventuringParties[partyName];
  if (!party) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

  if (Object.keys(party.characters).length >= MAX_PARTY_SIZE)
    throw new Error(ERROR_MESSAGES.GAME.MAX_PARTY_SIZE);

  const characterId = game.idGenerator.getNextEntityId();
  const newCharacter = new PlayerCharacter(
    nameOfControllingUser,
    combatantClass,
    characterName,
    characterId
  );

  outfitNewCharacter(gameServer, game.idGenerator, newCharacter);

  party.characters[characterId] = newCharacter;
  party.characterPositions.push(characterId);
  return characterId;
}
