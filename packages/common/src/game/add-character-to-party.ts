import { SpeedDungeonGame } from ".";
import { PlayerCharacter } from "../adventuring_party";
import outfitNewCharacter from "../adventuring_party/outfit-new-character";
import { MAX_PARTY_SIZE } from "../app_consts";
import { CombatantClass } from "../combatants";
import { ERROR_MESSAGES } from "../errors";
import { EntityId } from "../primatives";

export default function addCharacterToParty(
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

  outfitNewCharacter(game.idGenerator, newCharacter);

  party.characters[characterId] = newCharacter;
  party.characterPositions.push(characterId);
  return characterId;
}
