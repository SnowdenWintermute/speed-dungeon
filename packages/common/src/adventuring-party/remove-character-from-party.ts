import { AdventuringParty } from "./index.js";
import { EntityId } from "../primatives/index.js";

export default function removeCharacterFromParty(party: AdventuringParty, characterId: EntityId) {
  delete party.characters[characterId];
  const indexToRemove = party.characterPositions.indexOf(characterId);
  if (indexToRemove !== undefined) {
    party.characterPositions.splice(indexToRemove, 1);
  }
}
