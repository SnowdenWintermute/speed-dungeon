import { AdventuringParty } from ".";
import { EntityId } from "../primatives";

export default function removeCharacter(this: AdventuringParty, characterId: EntityId) {
  delete this.characters[characterId];
  const indexToRemove = this.characterPositions.indexOf(characterId);
  if (indexToRemove) {
    this.characterPositions.splice(indexToRemove, 1);
  }
}
