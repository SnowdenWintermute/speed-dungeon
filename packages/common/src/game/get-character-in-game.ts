import { SpeedDungeonGame } from ".";
import { PlayerCharacter } from "../adventuring_party";
import { ERROR_MESSAGES } from "../errors";
import { EntityId } from "../primatives";

export default function getCharacterInGame(
  game: SpeedDungeonGame,
  partyName: string,
  characterId: EntityId
): Error | PlayerCharacter {
  const party = game.adventuringParties[partyName];
  if (!party) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  const character = party.characters[characterId];
  if (!character) return new Error(ERROR_MESSAGES.GAME.CHARACTER_DOES_NOT_EXIST);

  return character;
}
