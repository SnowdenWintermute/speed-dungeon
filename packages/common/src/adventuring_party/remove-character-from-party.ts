import { AdventuringParty } from ".";
import { EntityId } from "../primatives";

export default function removeCharacterFromParty(party: AdventuringParty, characterId: EntityId) {
  console.log("removing characterId: ", characterId);
  delete party.characters[characterId];
  const indexToRemove = party.characterPositions.indexOf(characterId);
  if (indexToRemove) {
    party.characterPositions.splice(indexToRemove, 1);
  }
  console.log(
    "after removal characterPositions: ",
    JSON.stringify(party.characterPositions),
    "characters: ",
    Object.values(party.characters).map((character) => character.entityProperties.id)
  );
}
