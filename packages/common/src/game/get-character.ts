import { SpeedDungeonGame } from ".";
import { ERROR_MESSAGES } from "../errors";

export default function getCharacter(
  this: SpeedDungeonGame,
  partyName: string,
  characterId: number
) {
  const party = this.adventuringParties[partyName];
  if (!party) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  const character = party.characters[characterId];
  if (!character) throw new Error(ERROR_MESSAGES.GAME.CHARACTER_DOES_NOT_EXIST);

  return character;
}
