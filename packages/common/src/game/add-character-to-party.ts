import { SpeedDungeonGame } from ".";
import { PlayerCharacter } from "../adventuring_party";
import { MAX_PARTY_SIZE } from "../app_consts";
import { CombatantClass } from "../combatants";
import { ERROR_MESSAGES } from "../errors";
import { EntityId } from "../primatives";

export default function addCharacterToParty(
  this: SpeedDungeonGame,
  partyName: string,
  combatantClass: CombatantClass,
  characterName: string,
  nameOfControllingUser: string
): EntityId {
  const party = this.adventuringParties[partyName];
  if (!party) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

  if (Object.keys(party.characters).length >= MAX_PARTY_SIZE)
    throw new Error(ERROR_MESSAGES.GAME.MAX_PARTY_SIZE);

  const characterId = this.idGenerator.getNextEntityId();
  const newCharacter = new PlayerCharacter(
    nameOfControllingUser,
    combatantClass,
    characterName,
    this.idGenerator
  );

  party.characters[characterId] = newCharacter;
  party.characterPositions.push(characterId);
  return characterId;
}
