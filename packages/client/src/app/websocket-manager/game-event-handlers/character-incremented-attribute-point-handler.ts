import {
  CharacterAssociatedData,
  CombatAttribute,
  CombatantProperties,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export function characterIncrementedAttributePointHandler(
  characterId: string,
  attribute: CombatAttribute
) {
  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    CombatantProperties.incrementAttributePoint(character.combatantProperties, attribute);
  });
}
