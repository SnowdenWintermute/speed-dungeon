import { AdventuringParty } from ".";
import { EntityId } from "../primatives";

export default function removeCharacter(
  this: AdventuringParty,
  characterId: EntityId
) {
  this.characters.delete(characterId);
  const indexToRemove = this.characterPositions.indexOf(characterId);
  if (indexToRemove) {
    this.characterPositions.splice(indexToRemove, 1);
  }
}
