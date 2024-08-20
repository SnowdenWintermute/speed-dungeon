import { AdventuringParty } from ".";
import { EntityId } from "../primatives";

export default function removeCharacterFromParty(party: AdventuringParty, characterId: EntityId) {
  delete party.characters[characterId];
  const indexToRemove = party.characterPositions.indexOf(characterId);
  if (indexToRemove !== undefined) {
    party.characterPositions.splice(indexToRemove, 1);
  }
}
