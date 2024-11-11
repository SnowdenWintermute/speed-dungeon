import { SpeedDungeonGame } from "./index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { EntityId } from "../primatives/index.js";
import { Combatant } from "../combatants/index.js";

export default function getCharacterInGame(
  game: SpeedDungeonGame,
  partyName: string,
  characterId: EntityId
): Error | Combatant {
  const party = game.adventuringParties[partyName];
  if (!party) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  const character = party.characters[characterId];
  if (!character) return new Error(ERROR_MESSAGES.GAME.CHARACTER_DOES_NOT_EXIST);

  return character;
}
